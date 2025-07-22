-- Enable Row Level Security on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to documents (for semantic search)
CREATE POLICY "Allow public read access to documents" 
ON public.documents 
FOR SELECT 
USING (true);

-- Create policy to allow public insert for document uploads
CREATE POLICY "Allow public insert of documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow public update of documents 
CREATE POLICY "Allow public update of documents" 
ON public.documents 
FOR UPDATE 
USING (true);

-- Create policy to allow public delete of documents
CREATE POLICY "Allow public delete of documents" 
ON public.documents 
FOR DELETE 
USING (true);