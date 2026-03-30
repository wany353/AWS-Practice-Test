import re
import json


def clean_text(text):
    text = text.replace("ﬁ", "fi")
    text = re.sub(r'\n+', '\n', text)
    return text


def parse_questions(text):
    text = clean_text(text)

    blocks = re.split(r'(?=Question\s+#\d+)', text)

    results = []

    for block in blocks:
        block = block.strip()
        if not block.startswith("Question"):
            continue

        try:
            # ===== id =====
            q_id = re.search(r'Question\s+#(\d+)', block).group(1)

            # ===== topic =====
            topic_match = re.search(r'(Topic\s+\d+)', block)
            topic = topic_match.group(1) if topic_match else ""

            # ===== 多选答案 =====
            answer_match = re.search(r'Correct Answer:\s*([A-E]+)', block)
            answer = answer_match.group(1) if answer_match else ""

            # ===== 去掉答案及后面内容 =====
            block_clean = re.split(r'Correct Answer:', block)[0]

            # ===== 选项 =====
            options = {}
            option_matches = re.findall(
                r'([A-E])\.\s*(.*?)(?=\n[A-E]\.|$)',
                block_clean,
                re.S
            )

            for key, value in option_matches:
                options[key] = value.strip().replace("\n", " ")

            # ===== 题干 =====
            question_part = re.sub(r'Question\s+#\d+\s+Topic\s+\d+', '', block_clean)
            question_part = re.split(r'\nA\.\s*', question_part)[0]
            question = " ".join(question_part.strip().split())

            results.append({
                "id": q_id,
                "question": question,
                "options": options,
                "answer": answer,   # 这里已经支持 AE
                "topic": topic
            })

        except Exception as e:
            print(f"解析失败: {block[:50]}")
            continue

    return results


# ===== 主程序 =====
if __name__ == "__main__":
    file_path = "./extracted_txt/aws_exam.txt"
    output_path = "aws_question.json"
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    data = parse_questions(text)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print("转换完成 ")