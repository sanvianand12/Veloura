from pydantic import BaseModel, Field, field_validator

class RegisterInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=12, max_length=128)
    confirm_password: str = Field(min_length=12, max_length=128)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()
        if not value: raise ValueError("Name is required")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value):
        value = value.strip().lower()
        if "@" not in value or "." not in value.rsplit("@", 1)[-1]: raise ValueError("Enter a valid email address")
        return value

class LoginInput(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False

class ResetRequest(BaseModel): email: str
class ResetPasswordInput(BaseModel):
    token: str
    password: str = Field(min_length=12, max_length=128)
    confirm_password: str = Field(min_length=12, max_length=128)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
