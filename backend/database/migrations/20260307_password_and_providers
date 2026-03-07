DO $$
BEGIN
    -- 2. Xử lý đổi tên cột trong bảng 'provider' (image -> legal_documents)
    -- Chỉ đổi nếu cột cũ tồn tại và cột mới chưa có
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider' AND column_name = 'image') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider' AND column_name = 'legal_documents') THEN
        RAISE NOTICE 'Đang đổi tên provider.image thành provider.legal_documents...';
        ALTER TABLE provider RENAME COLUMN image TO legal_documents;
    END IF;

    -- 3. Đảm bảo 'legal_documents' là kiểu MẢNG (TEXT[]) để hỗ trợ nhiều ảnh
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'provider' 
          AND column_name = 'legal_documents' 
          AND data_type != 'ARRAY'
    ) THEN
        RAISE NOTICE 'Đang chuyển đổi legal_documents sang kiểu TEXT ARRAY...';
        ALTER TABLE provider ALTER COLUMN legal_documents TYPE TEXT[] USING 
            CASE 
                WHEN legal_documents IS NULL THEN '{}'::TEXT[] 
                ELSE ARRAY[legal_documents] 
            END;
        ALTER TABLE provider ALTER COLUMN legal_documents SET DEFAULT '{}'::TEXT[];
    END IF;

    -- 4. Tự động thêm các cột còn thiếu vào bảng 'provider' nếu chưa có
    ALTER TABLE provider ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
    ALTER TABLE provider ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
    ALTER TABLE provider ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
    ALTER TABLE provider ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100);
    ALTER TABLE provider ADD COLUMN IF NOT EXISTS fanpage VARCHAR(255);
    ALTER TABLE provider ADD COLUMN IF NOT EXISTS email VARCHAR(255);

END $$;
