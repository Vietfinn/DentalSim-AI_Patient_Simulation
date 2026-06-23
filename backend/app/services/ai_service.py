import os
import re
import yaml
import asyncio
from typing import List, Dict, Any, AsyncGenerator
from groq import AsyncGroq
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            self.client = None
        else:
            self.client = AsyncGroq(api_key=self.api_key)
            
        # Cache prompt template path
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            "prompts", 
            "patient_system.yaml"
        )

    def _load_prompt_template(self) -> str:
        if not os.path.exists(self.prompt_path):
            raise FileNotFoundError(f"Prompt template not found at {self.prompt_path}")
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data["template"]

    def generate_system_prompt(self, case: Any) -> str:
        # Resolve patient info and other fields from SQLAlchemy model or dict
        if hasattr(case, "patient_info"):
            patient_info = case.patient_info
            ai_persona = case.ai_persona
            clinical_logic = case.clinical_logic
            diagnosis = case.diagnosis
        elif isinstance(case, dict):
            patient_info = case.get("patient_info") or case.get("patient") or {}
            ai_persona = case.get("ai_persona", "")
            clinical_logic = case.get("clinical_logic") or case.get("logic", "")
            diagnosis = case.get("diagnosis", "")
        else:
            raise ValueError("Invalid case data type")

        medical_history = patient_info.get(
            "medical_history", "Không có tiền sử bệnh lý hay thói quen xấu gì đặc biệt."
        )
        if not medical_history:
            medical_history = "Không có tiền sử bệnh lý hay thói quen xấu gì đặc biệt."

        template = self._load_prompt_template()
        return template.format(
            patient_name=patient_info.get("name", "Bệnh nhân"),
            patient_age=patient_info.get("age", 30),
            patient_gender=patient_info.get("gender", "Nam/Nữ"),
            medical_history=medical_history,
            complaint=patient_info.get("complaint", ""),
            ai_persona=ai_persona,
            clinical_logic=clinical_logic,
            diagnosis=diagnosis
        )

    def detect_prompt_injection(self, text: str) -> bool:
        if not text:
            return False
        
        injection_keywords = [
            "system prompt", "bỏ qua chỉ dẫn", "bỏ qua quy tắc", "bỏ qua luật", "bỏ qua yêu cầu",
            "ignore instructions", "override instructions", "developer mode", 
            "lộ chỉ dẫn", "in ra hướng dẫn", "sysprompt", "jailbreak", "ignore rules", "ignore rule", "ignore prompt",
            "bỏ qua tất cả quy tắc", "hãy làm trợ lý", "you are an ai",
            "forget previous rules", "forget instructions", "system instructions", "previous rules"
        ]
        
        text_lower = text.lower()
        for kw in injection_keywords:
            if kw in text_lower:
                return True
        return False

    def sanitize_text(self, text: str, diagnosis: str) -> str:
        if not text:
            return ""
            
        replacements = {}
        
        # 1. Block general clinical terms
        blocked_terms = {
            "viêm tủy không hồi phục": "đau tủy răng nghiêm trọng",
            "viêm tủy có hồi phục": "ê buốt răng nhẹ",
            "viêm tủy": "đau nhức tủy răng",
            "hoại tử tủy": "chết tủy răng",
            "viêm quanh chóp cấp": "sưng buốt chân răng",
            "áp xe quanh chóp cấp": "cục sưng mủ chân răng",
            "viêm quanh chóp mạn": "ê chân răng âm ỉ",
            "áp xe quanh chóp mạn": "đường rò mủ ở nướu",
            "viêm lợi hoại tử loét cấp (nug)": "nướu lở loét đau nhức",
            "viêm lợi hoại tử loét cấp": "nướu lở loét đau nhức",
            "viêm lợi hoại tử": "nướu loét đau nhức",
            "phì đại lợi do thuốc": "sưng nướu do tác dụng phụ của thuốc",
            "phì đại lợi": "lợi phì sưng to",
            "viêm nha chu": "đau nướu buốt răng",
            "viêm lợi": "sưng nướu chân răng",
            "viêm quanh implant": "viêm quanh trụ răng giả",
            "viêm lợi trùm": "sưng lợi ở răng khôn",
            "viêm huyệt ổ răng khô": "huyệt ổ răng trống đau nhức",
            "sót chân răng": "mảnh chân răng còn thừa",
            "nhiệt miệng": "vết loét rát trong miệng",
            "nấm miệng": "mảng trắng tưa lưỡi",
            "bạch sản niêm mạc": "mảng trắng trong má",
            "lichen phẳng": "vết trắng rát má",
            "viêm tuyến nước bọt": "sưng tuyến mang tai",
            "u hạt sinh mủ": "cục u máu ở lợi",
            "nang chân răng": "nang xương ở chân răng",
            "răng ngầm": "răng mọc ngầm",
            "lún răng chấn thương": "răng bị lún sâu",
            "bán trật khớp răng": "răng lung lay chấn thương",
            "rơi răng khỏi ổ": "rụng răng ra ngoài",
            "răng chen chúc": "răng lộn xộn",
            "khớp cắn ngược": "khớp cắn móm",
            "khớp cắn sâu": "răng trên phủ quá sâu",
            "khớp cắn hở": "răng cửa không chạm nhau",
            "polyp tủy": "cục thịt thừa ở tủy",
            "đau dây thần kinh v": "đau giật nửa mặt",
            "gãy xương hàm": "gãy xương quai hàm",
            "thiếu sản men răng": "men răng mỏng yếu",
            "tiêu xương ổ răng": "tiêu xương quanh răng",
            "tiêu xương": "tiêu xương",
            "túi nha chu": "túi mủ ở lợi",
            "thử lạnh": "uống nước đá",
            "thử điện": "đo điện răng",
            "gõ dọc": "gõ vào răng",
            "gõ ngang": "lay thử răng"
        }
        
        for k, v in blocked_terms.items():
            replacements[k.lower()] = v
            
        # 2. Block the specific diagnosis of the case (highest priority, overrides general terms)
        if diagnosis:
            replacements[diagnosis.lower()] = "bệnh lý răng miệng"
            
        # Sort terms by length in descending order to avoid partial replacement of substrings
        sorted_terms = sorted(replacements.keys(), key=len, reverse=True)
        
        sanitized = text
        for term in sorted_terms:
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            sanitized = pattern.sub(replacements[term], sanitized)
            
        return sanitized


    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    async def get_response(self, history: List[Dict[str, str]], case: Any) -> str:
        if not self.client:
            return "⚠️ Lỗi Hệ Thống: Chưa cấu hình API Key trong backend/.env"

        # 1. Check for prompt injection in the latest message
        latest_message = history[-1]["content"] if history else ""
        if self.detect_prompt_injection(latest_message):
            return "Ơ, bác sĩ đang nói gì thế ạ? Tôi không hiểu lắm, tôi chỉ muốn khám răng thôi..."

        system_prompt = self.generate_system_prompt(case)
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        try:
            completion = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
                presence_penalty=0.1,
                frequency_penalty=0.3,
            )
            raw_response = completion.choices[0].message.content
            
            # 2. Sanitize output before returning
            diagnosis = getattr(case, "diagnosis", "") or case.get("diagnosis", "") if not isinstance(case, str) else ""
            return self.sanitize_text(raw_response, diagnosis)
        except Exception as e:
            raise e

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=6),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    async def get_streaming_response(
        self, history: List[Dict[str, str]], case: Any
    ) -> AsyncGenerator[str, None]:
        if not self.client:
            yield "⚠️ Lỗi Hệ Thống: Chưa cấu hình API Key trong backend/.env"
            return

        # 1. Check for prompt injection in the latest message
        latest_message = history[-1]["content"] if history else ""
        if self.detect_prompt_injection(latest_message):
            # Stream the bypass response word-by-word to simulate normal behavior
            bypass_text = "Ơ, bác sĩ đang nói gì thế ạ? Tôi không hiểu lắm, tôi chỉ muốn khám răng thôi..."
            for word in bypass_text.split(" "):
                yield word + " "
                await asyncio.sleep(0.05)
            return

        system_prompt = self.generate_system_prompt(case)
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        diagnosis = getattr(case, "diagnosis", "") or case.get("diagnosis", "") if not isinstance(case, str) else ""

        try:
            stream = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
                presence_penalty=0.1,
                frequency_penalty=0.3,
                stream=True
            )
            
            # Keep track of full unsanitized text and already yielded sanitized text
            unsanitized_buffer = ""
            sanitized_yielded = ""
            # Set safety window size larger than any blocked term (e.g., 70 characters)
            window_size = 70
            
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    unsanitized_buffer += content
                    sanitized_full = self.sanitize_text(unsanitized_buffer, diagnosis)
                    
                    safe_length = len(unsanitized_buffer) - window_size
                    if safe_length > len(sanitized_yielded):
                        text_to_yield = sanitized_full[len(sanitized_yielded):safe_length]
                        if text_to_yield:
                            yield text_to_yield
                            sanitized_yielded += text_to_yield
            
            # Yield remaining buffer content on stream completion
            sanitized_full = self.sanitize_text(unsanitized_buffer, diagnosis)
            remainder = sanitized_full[len(sanitized_yielded):]
            if remainder:
                yield remainder
                
        except Exception as e:
            yield f"❌ Lỗi kết nối AI: {str(e)}"

ai_service = AIService()

