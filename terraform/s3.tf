# 使用する時にコメント解除
# resource "aws_s3_bucket" "private" {
#   bucket = "private-tf-practice-bucket-yus"

#   versioning {
#     enabled = true
#   }
#   server_side_encryption_configuration {
#     rule {
#       apply_server_side_encryption_by_default {
#         sse_algorithm = "AES256"
#       }
#     }
#   }
# }

# ブロックパブリックアクセス
# 予期しないオブジェクトの公開を抑止できる。特に理由がなければ全ての設定を有効にする
# resource "aws_s3_bucket_public_access_block" "private" {
#   bucket                  = aws_s3_bucket.private.id
#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# # パブリックバケット
# resource "aws_s3_bucket" "public" {
#   bucket = "public-tf-practice-bucket-yus"

#   cors_rule {
#     allowed_origins = ["https://example.com"]
#     allowed_methods = ["GET"]
#     allowed_headers = ["*"]
#     max_age_seconds = 3000
#   }
# }
