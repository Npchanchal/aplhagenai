# CloudWatch alarms + EFS backup for auth persistence.

resource "aws_sns_topic" "alarms" {
  count = var.enable_cloudwatch_alarms ? 1 : 0
  name  = "${local.name_prefix}-alarms"
}

resource "aws_sns_topic_subscription" "alarms_email" {
  count     = var.enable_cloudwatch_alarms && var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${local.name_prefix}-alb-target-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB target 5xx spike — check ECS task logs"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms[0].arn]

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${local.name_prefix}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "ALB reports unhealthy ECS targets"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms[0].arn]

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${local.name_prefix}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS service CPU sustained above 85%"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms[0].arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
}

# Daily EFS backup for auth.db (when EFS auth volume is enabled).
resource "aws_iam_role" "backup" {
  count = var.enable_auth_efs && var.use_db_auth && var.enable_efs_backup ? 1 : 0
  name  = "${local.name_prefix}-backup"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  count      = var.enable_auth_efs && var.use_db_auth && var.enable_efs_backup ? 1 : 0
  role       = aws_iam_role.backup[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_backup_vault" "auth" {
  count = var.enable_auth_efs && var.use_db_auth && var.enable_efs_backup ? 1 : 0
  name  = "${local.name_prefix}-auth-vault"
}

resource "aws_backup_plan" "auth_efs" {
  count = var.enable_auth_efs && var.use_db_auth && var.enable_efs_backup ? 1 : 0
  name  = "${local.name_prefix}-auth-efs-daily"

  rule {
    rule_name         = "daily-auth-efs"
    target_vault_name = aws_backup_vault.auth[0].name
    schedule          = "cron(0 3 * * ? *)"

    lifecycle {
      delete_after = var.efs_backup_retention_days
    }
  }
}

resource "aws_backup_selection" "auth_efs" {
  count        = var.enable_auth_efs && var.use_db_auth && var.enable_efs_backup ? 1 : 0
  name         = "${local.name_prefix}-auth-efs"
  plan_id      = aws_backup_plan.auth_efs[0].id
  iam_role_arn = aws_iam_role.backup[0].arn

  resources = [aws_efs_file_system.auth[0].arn]
}
