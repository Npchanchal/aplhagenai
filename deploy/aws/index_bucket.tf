# Frozen daily GCI files (W9.2). Created only when enable_index_bucket = true
# so a routine apply does not open a new bucket.

resource "aws_s3_bucket" "index" {
  count  = var.enable_index_bucket ? 1 : 0
  bucket = "${local.name_prefix}-gci-index-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "index" {
  count  = var.enable_index_bucket ? 1 : 0
  bucket = aws_s3_bucket.index[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "index" {
  count  = var.enable_index_bucket ? 1 : 0
  bucket = aws_s3_bucket.index[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "index" {
  count                   = var.enable_index_bucket ? 1 : 0
  bucket                  = aws_s3_bucket.index[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role_policy" "ecs_task_index_s3" {
  count = var.enable_index_bucket ? 1 : 0
  name  = "${local.name_prefix}-ecs-task-index-s3"
  role  = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.index[0].arn,
        "${aws_s3_bucket.index[0].arn}/*"
      ]
    }]
  })
}
