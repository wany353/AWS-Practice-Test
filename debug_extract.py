import pdfplumber
import os
import unicodedata

def heavy_clean(text):
    """
    深度清洗文本：处理合字、剔除不可见控制字符
    """
    if not text:
        return ""
    
    # ✅ 0. 先修复 PDF 错误编码（关键！！）
    text = text.replace("\u0000", "fi")

    # 可选：如果你怀疑还有别的异常映射
    # text = text.replace("\u0001", "fl")  # 示例
    
    # 1. Unicode 标准化（会自动处理 ﬁ → fi）
    text = unicodedata.normalize('NFKC', text)
    
    # 2. 删除控制字符（但保留换行、制表）
    text = "".join(
        ch for ch in text
        if unicodedata.category(ch)[0] != 'C' or ch in '\n\t'
    )
    
    # 3. 处理换页符
    text = text.replace('\x0c', '\n\n--- Page Break ---\n\n')
    
    return text

def batch_extract_pdf_to_txt(input_folder, output_folder):
    # 如果输出文件夹不存在，则创建
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"已创建输出目录: {output_folder}")

    # 遍历输入文件夹
    for filename in os.listdir(input_folder):
        if filename.lower().endswith(".pdf"):
            pdf_path = os.path.join(input_folder, filename)
            # 生成对应的 TXT 文件名
            txt_filename = os.path.splitext(filename)[0] + ".txt"
            txt_path = os.path.join(output_folder, txt_filename)
            
            print(f"正在处理: {filename} ...")
            
            try:
                all_pages_text = []
                with pdfplumber.open(pdf_path) as pdf:
                    # 遍历 PDF 的每一页
                    for i, page in enumerate(pdf.pages):
                        raw_text = page.extract_text()
                        if raw_text:
                            all_pages_text.append(raw_text)
                
                # 合并全文并进行深度清洗
                full_content = "\n".join(all_pages_text)
                cleaned_content = heavy_clean(full_content)
                
                # 保存为 TXT
                # 使用 utf-8-sig (带有 BOM 的 UTF-8)，确保 Windows 记事本不会乱码
                with open(txt_path, "w", encoding="utf-8-sig") as f:
                    f.write(cleaned_content)
                
                print(f"成功保存至: {txt_filename}")
                
            except Exception as e:
                print(f"处理文件 {filename} 时发生错误: {e}")

# --- 执行区 ---
if __name__ == "__main__":
    # 配置您的路径
    input_dir = "e:/AWS-Practice-Test/"
    output_dir = "e:/AWS-Practice-Test/extracted_txt/"
    
    batch_extract_pdf_to_txt(input_dir, output_dir)
    print("\n所有任务已完成！")