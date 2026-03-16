# ProfileCore Parser

FastAPI worker service responsible for:

- claiming queued extraction runs from Supabase
- downloading private PDF documents from storage
- extracting and cleaning text with PyMuPDF
- converting the text into the shared ProfileCore JSON schema
- persisting structured profiles and section payloads back to Supabase
