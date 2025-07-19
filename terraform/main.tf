provider "aws" {
  region = "ap-northeast-1"
}

module "describe_regions_for_ec2" {
  source     = "./iam_role"
  name       = "describe-regions-for-ec2"
  identifier = "ec2.amazonaws.com"
  policy     = module.describe_regions_for_ec2.allow_describe_regions_policy
}

# todo: 後でコメント解除予定
# # ログローテーションバケット（AWS各種サービスがログを保存するバケット）
# resource "aws_s3_bucket" "alb_log" {
#   bucket = "alb-log-tf-practice-yus"
# 
#   # 強制削除（一時的に有効化）
#   force_destroy = true
#   lifecycle_rule {
#     enabled = true
# 
#     expiration {
#       days = "180"
#     }
#   }
# }
# 
# resource "aws_s3_bucket_policy" "alb_log" {
#   bucket = aws_s3_bucket.alb_log.id
#   policy = data.aws_iam_policy_document.alb_log.json
# }
# 
# data "aws_iam_policy_document" "alb_log" {
#   statement {
#     effect    = "Allow"
#     actions   = ["s3:PutObject"]
#     resources = ["arn:aws:s3:::${aws_s3_bucket.alb_log.id}/*"]
# 
#     principals {
#       type        = "AWS"
#       identifiers = ["582318560864"]
#     }
#   }
# }

resource "aws_vpc" "app" {
  cidr_block = "10.0.0.0/16"

  # DNSサーバーによる名前解決を有効にする
  enable_dns_support = true

  # VPC内のリソースにパブリックDNSホスト名を自動で割り当てる
  enable_dns_hostnames = true

  tags = {
    Name = "scalable-todo-vpc"
  }
}

# パブリックサブネット
resource "aws_subnet" "public_0" {
  vpc_id = aws_vpc.app.id
  # CIDRブロックはとくにこだわりがなければVPCでは/16、サブネットでは/24にするとわかりやすい
  cidr_block = "10.0.1.0/24"
  # そのサブネットで起動したインスタンスにパブリックIPアドレスを自動的に割り当てる
  map_public_ip_on_launch = true
  availability_zone       = "ap-northeast-1a"
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.app.id
  cidr_block              = "10.0.2.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "ap-northeast-1c"
}

# igw
# VPCとインターネット間で通信できるようにする
resource "aws_internet_gateway" "app" {
  vpc_id = aws_vpc.app.id
}

# igwだけではネットに接続できない。ネットワークにデータを流すためルーティング情報を管理するルートテーブルを用意
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.app.id
}

# ルート
resource "aws_route" "public" {
  route_table_id         = aws_route_table.public.id
  gateway_id             = aws_internet_gateway.app.id
  destination_cidr_block = "0.0.0.0/0"
}

# ルートテーブルの関連付け
resource "aws_route_table_association" "public_0" {
  subnet_id      = aws_subnet.public_0.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

# プライベートネットワーク
# DBサーバーのようにネットからアクセスしないものを置く
# システムをセキュアにするため、パブリックネットワークには最小限のリソースのみ配置し、それ以外はプライベートネットワークにおくのが定石

# プライベートサブネット
resource "aws_subnet" "private_0" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = "10.0.65.0/24"
  availability_zone = "ap-northeast-1a"
  # パブリックIPアドレスは不要
  map_public_ip_on_launch = false
}

resource "aws_subnet" "private_1" {
  vpc_id                  = aws_vpc.app.id
  cidr_block              = "10.0.66.0/24"
  availability_zone       = "ap-northeast-1c"
  map_public_ip_on_launch = false
}

# ルートテーブルと関連付け
resource "aws_route_table" "private_0" {
  vpc_id = aws_vpc.app.id
}

resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.app.id
}

# ルート
# プライベートネットワークからネットへ通信するためにルートを定義
resource "aws_route" "private_0" {
  route_table_id         = aws_route_table.private_0.id
  nat_gateway_id         = aws_nat_gateway.nat_gateway_0.id
  destination_cidr_block = "0.0.0.0/0"
}

resource "aws_route" "private_1" {
  route_table_id         = aws_route_table.private_1.id
  nat_gateway_id         = aws_nat_gateway.nat_gateway_1.id
  destination_cidr_block = "0.0.0.0/0"
}

resource "aws_route_table_association" "private_0" {
  subnet_id      = aws_subnet.private_0.id
  route_table_id = aws_route_table.private_0.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

# NATサーバーを導入するとプライベートネットワークからインターネットへアクセス可能になる
# NATゲートウェイにはEIPが必要
resource "aws_eip" "nat_gateway_0" {
  vpc        = true
  depends_on = [aws_internet_gateway.app]
}

resource "aws_eip" "nat_gateway_1" {
  vpc        = true
  depends_on = [aws_internet_gateway.app]
}

# NATゲートウェイ
resource "aws_nat_gateway" "nat_gateway_0" {
  allocation_id = aws_eip.nat_gateway_0.id
  subnet_id     = aws_subnet.public_0.id
  depends_on    = [aws_internet_gateway.app]
}

resource "aws_nat_gateway" "nat_gateway_1" {
  allocation_id = aws_eip.nat_gateway_1.id
  subnet_id     = aws_subnet.public_1.id
  depends_on    = [aws_internet_gateway.app]
}

resource "aws_lb" "app" {
  name               = "app"
  load_balancer_type = "application"
  internal           = false
  idle_timeout       = 60

  # 基本はtrueだが一時的にfalseにしてる
  enable_deletion_protection = false

  subnets = [
    aws_subnet.public_0.id,
    aws_subnet.public_1.id,
  ]

  # todo: 後でコメント解除予定
  # access_logs {
  #   bucket  = aws_s3_bucket.alb_log.id
  #   enabled = true
  # }

  security_groups = [
    module.http_sg.security_group_id,
    # todo: 後でコメント解除予定
    # module.https_sg.security_group_id,
    # module.http_redirect_sg.security_group_id,
    module.frontend_sg.security_group_id,
  ]
}

output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

module "http_sg" {
  source      = "./security_group"
  name        = "http-sg"
  vpc_id      = aws_vpc.app.id
  port        = 80
  cidr_blocks = ["0.0.0.0/0"]
}

# todo: 後でコメント解除予定
# module "https_sg" {
#   source      = "./security_group"
#   name        = "https-sg"
#   vpc_id      = aws_vpc.app.id
#   port        = 443
#   cidr_blocks = ["0.0.0.0/0"]
# }
# 
# module "http_redirect_sg" {
#   source      = "./security_group"
#   name        = "http-redirect-sg"
#   vpc_id      = aws_vpc.app.id
#   port        = 8080
#   cidr_blocks = ["0.0.0.0/0"]
# }

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "これは「HTTP」です"
      status_code  = "200"
    }
  }
}

# todo: 後でコメント解除予定
# # ホストゾーン
# # DNSレコードを束ねるリソースで、Route53でドメイン登録した場合は自動的に作成される。そのホストゾーンは以下で参照する
# data "aws_route53_zone" "main" {
#   name = "pf-goal-app.net"
# }
# 
# # DNSレコードの定義
# # 設定したドメインでALBにアクセスできるようになる
# resource "aws_route53_record" "main" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = data.aws_route53_zone.main.name
#   type    = "A"
# 
#   alias {
#     name                   = aws_lb.app.dns_name
#     zone_id                = aws_lb.app.zone_id
#     evaluate_target_health = true
#   }
# }
# 
# resource "aws_route53_record" "api" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "api.pf-goal-app.net"
#   type    = "A"
# 
#   alias {
#     name                   = aws_lb.app.dns_name
#     zone_id                = aws_lb.app.zone_id
#     evaluate_target_health = true
#   }
# }
# 
# output "domain_name" {
#   value = aws_route53_record.main.name
# }

# todo: 後でコメント解除予定
# # SSL証明書の作成
# resource "aws_acm_certificate" "app" {
#   domain_name = aws_route53_record.main.name
# 
#   # ドメイン名を追加したい場合、以下に追加する。例えば["test.example.com"]
#   subject_alternative_names = ["api.pf-goal-app.net"]
# 
#   # ドメインの所有権の検証方法を指定
#   # DNS検証かメール検証を選択できる。SSL証明書を自動更新したい場合、DNS検証を選択
#   validation_method = "DNS"
# 
#   lifecycle {
#     # 新しい証明書を作ってから古いものと差し替える
#     create_before_destroy = true
#   }
# }
# 
# # SSL証明書の検証
# # DNS検証用のDNSレコードを追加
# resource "aws_route53_record" "app_certificate" {
#   for_each = {
#     for dvo in aws_acm_certificate.app.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       type   = dvo.resource_record_type
#       record = dvo.resource_record_value
#     }
#   }
# 
#   name    = each.value.name
#   type    = each.value.type
#   records = [each.value.record]
#   zone_id = data.aws_route53_zone.main.id
#   ttl     = 60
# }
# 
# resource "aws_acm_certificate_validation" "app" {
#   certificate_arn         = aws_acm_certificate.app.arn
#   validation_record_fqdns = [for record in aws_route53_record.app_certificate : record.fqdn]
# }

# todo: 後でコメント解除予定
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.app.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   certificate_arn   = aws_acm_certificate.app.arn
#   ssl_policy        = "ELBSecurityPolicy-2016-08"
# 
#   default_action {
#     type = "fixed-response"
# 
#     fixed_response {
#       content_type = "text/plain"
#       message_body = "これはHTTPSです"
#       status_code  = "200"
#     }
#   }
# }
# 
# resource "aws_lb_listener" "redirect_http_to_https" {
#   load_balancer_arn = aws_lb.app.arn
#   port              = "8080"
#   protocol          = "HTTP"
# 
#   default_action {
#     type = "redirect"
# 
#     redirect {
#       port        = "443"
#       protocol    = "HTTPS"
#       status_code = "HTTP_301"
#     }
#   }
# }

# ターゲットグループ
# ALBがリクエストをフォワードする対象
resource "aws_lb_target_group" "frontend" {
  name                 = "tg-frontend"
  target_type          = "ip"
  vpc_id               = aws_vpc.app.id
  port                 = 3010
  protocol             = "HTTP"
  deregistration_delay = 300

  health_check {
    path = "/api/healthcheck"
    # 正常判定を行うまでのヘルスチェック実行回数
    healthy_threshold = 5
    # 異常判定を行うまでのヘルスチェック実行回数
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    # 正常判定を行うために使用するHTTPステータスコード
    matcher = 200
    # ヘルスチェックで使用するポート
    port     = "traffic-port"
    protocol = "HTTP"
  }

  depends_on = [aws_lb.app]
}

# リスナールール
# ターゲットグループにリクエストをフォワードするルール
resource "aws_lb_listener_rule" "frontend" {
  listener_arn = aws_lb_listener.http.arn
  # 優先順位を指定。数字が小さいほど優先度が高い
  priority = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

resource "aws_lb_target_group" "backend" {
  name                 = "tg-backend"
  target_type          = "ip"
  vpc_id               = aws_vpc.app.id
  port                 = 3011
  protocol             = "HTTP"
  deregistration_delay = 300

  health_check {
    path = "/healthcheck"
    # 正常判定を行うまでのヘルスチェック実行回数
    healthy_threshold = 5
    # 異常判定を行うまでのヘルスチェック実行回数
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    # 正常判定を行うために使用するHTTPステータスコード
    matcher = 200
    # ヘルスチェックで使用するポート
    port     = "traffic-port"
    protocol = "HTTP"
  }

  depends_on = [aws_lb.app]
}

resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# # クラスタ: Dockerコンテナを実行するサーバーを束ねるリソース
resource "aws_ecs_cluster" "app" {
  name = "app-cluster"
}

# ECSサービスは起動するタスクの数を定義でき、指定した数のタスクを維持する。何らかの理由でタスクが終了しても自動で新しいタスクを起動する
resource "aws_ecs_service" "backend" {
  name            = "backend"
  cluster         = aws_ecs_cluster.app.arn
  task_definition = aws_ecs_task_definition.app.arn

  # ECSタスクが/db/hostnameのSSMパラメータを参照するため、
  # RDS作成とSSMパラメータ設定完了まで待機する必要がある
  depends_on = [
    aws_ssm_parameter.db_hostname,
    aws_ssm_parameter.db_dbname,
    aws_ssm_parameter.db_username,
    aws_ssm_parameter.db_password
  ]

  # ECSサービスが維持するタスク数
  # 1を指定するとコンテナが異常終了するとECSサービスがタスクを再起動するまでアクセスできなくなるので2以上を指定
  desired_count = 2

  launch_type      = "FARGATE"
  platform_version = "1.3.0"

  # タスク起動時のヘルスチェック猶予期間
  # タスク起動に時間がかかる場合、十分な時間を用意しないとヘルスチェックに引っかかり、タスクの起動と終了が無限に続いてしまう。なので0以上を指定する
  health_check_grace_period_seconds = 60

  network_configuration {
    assign_public_ip = false
    security_groups  = [module.backend_sg.security_group_id]

    subnets = [
      aws_subnet.private_0.id,
      aws_subnet.private_1.id,
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3011
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

module "backend_sg" {
  source      = "./security_group"
  name        = "backend-sg"
  vpc_id      = aws_vpc.app.id
  port        = 3011
  cidr_blocks = [aws_vpc.app.cidr_block]
}

resource "aws_ecs_service" "frontend" {
  name            = "frontend"
  cluster         = aws_ecs_cluster.app.arn
  task_definition = aws_ecs_task_definition.app.arn

  desired_count = 2

  launch_type      = "FARGATE"
  platform_version = "1.3.0"

  health_check_grace_period_seconds = 60

  network_configuration {
    assign_public_ip = true
    security_groups  = [module.frontend_sg.security_group_id]

    subnets = [
      aws_subnet.public_0.id,
      aws_subnet.public_1.id,
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3010
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

module "frontend_sg" {
  source      = "./security_group"
  name        = "frontend-sg"
  vpc_id      = aws_vpc.app.id
  port        = 3010
  cidr_blocks = [aws_vpc.app.cidr_block]
}

# cloudwatch ログ
# Fargateではホストサーバーにログインできず、コンテナのログを直接確認できないのでログで確認できるようにする
resource "aws_cloudwatch_log_group" "for_ecs_backend" {
  name              = "/ecs/backend"
  retention_in_days = 180
}

resource "aws_cloudwatch_log_group" "for_ecs_frontend" {
  name              = "/ecs/frontend"
  retention_in_days = 180
}

# ECSタスク実行IAMロールを作成
# IAMポリシーデータソース
data "aws_iam_policy" "ecs_task_execution_role_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ポリシードキュメント
data "aws_iam_policy_document" "ecs_task_execution" {
  # 既存のポリシー（AmazonECSTaskExecutionRolePolicy）を継承
  source_policy_documents = [data.aws_iam_policy.ecs_task_execution_role_policy.policy]

  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameters",
      "kms:Decrypt",
      # ECR用権限
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchCheckLayerAvailability",
      "ecr:DescribeRepositories",
      "ecr:BatchGetImage"
    ]
    resources = ["*"]
  }
}

# # ECSタスク実行IAMロールの定義
module "ecs_task_execution_role" {
  source     = "./iam_role"
  name       = "ecs-task-execution"
  identifier = "ecs-tasks.amazonaws.com"
  policy     = data.aws_iam_policy_document.ecs_task_execution.json
}

# タスク：コンテナの実行単位
# タスクはタスク定義で作られる
resource "aws_ecs_task_definition" "app" {
  # タスク定義名のプレフィックス
  family                   = "app-task"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  container_definitions    = file("./container_definitions.json")
  execution_role_arn       = module.ecs_task_execution_role.iam_role_arn
}

# todo: 後でコメント解除予定
# # cloudwatchイベントからECSを起動するためのIAMロールを作成する
# module "ecs_events_role" {
#   source     = "./iam_role"
#   name       = "ecs-events"
#   identifier = "events.amazonaws.com"
#   policy     = data.aws_iam_policy.ecs_events_role_policy.policy
# }
# 
# data "aws_iam_policy" "ecs_events_role_policy" {
#   # このポリシーでは「タスクを実行する」権限と「タスクにIAMロールを渡す」権限を付与する
#   arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceEventsRole"
# }

# todo: 後でコメント解除予定
# # カスタマーキー
# resource "aws_kms_key" "app" {
#   # 使用用途
#   description         = "Customer Master Keyテストです!!"
#   enable_key_rotation = true
#   # キーを有効にするかどうか
#   is_enabled = true
#   # 削除待機期間
#   deletion_window_in_days = 30
# }
# 
# # カスタマーキーにはUUIDが割り当てられるが、わかりづらい。なのでエイリアスを設定し、用途をわかりやすくする
# resource "aws_kms_alias" "app" {
#   name          = "alias/app"
#   target_key_id = aws_kms_key.app.key_id
# }

# SSMパラメータストア
# 環境変数を使用するため用意

# /db/usernameのキー名で「root」という値を平文で保存
resource "aws_ssm_parameter" "db_username" {
  name        = "/db/username"
  value       = "root"
  type        = "String"
  description = "DBのユーザー名"
}

# ここでvalue指定したものを暗号化でもできるがセキュリティ的によくない。なのでダミー値を設定し後でAWS CLIで更新する

# 以下コマンドでAWS CLIで上書きする（例）
# aws ssm put-parameter --name '/db/password' --type SecureString \
# --value 'newPassword123!' --overwrite

resource "aws_ssm_parameter" "db_password" {
  name        = "/db/raw_password"
  value       = "uninitialized"
  type        = "SecureString"
  description = "DBのパスワード"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "db_hostname" {
  name        = "/db/hostname"
  value       = aws_db_instance.scalable-todo-db.address
  type        = "String"
  description = "DBのhost名"
}

resource "aws_ssm_parameter" "db_dbname" {
  name        = "/db/dbname"
  value       = "scalable-todo-db"
  type        = "String"
  description = "DB名"
}

# todo: postgresqlに変える
# MySQLを使用
# MySQLのmy.cnfファイルに定義するようなDBの設定を以下のDBパラメータグループに書く
resource "aws_db_parameter_group" "app" {
  name   = "db-parameter-group"
  family = "postgres17"

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }
}

# DBオプショングループ（DBエンジンにオプションを追加できる）
# 以下ではMariaDB監査プラグインを追加している
# ユーザーのログインや実行したクエリなどのアクティビティを記録できる
resource "aws_db_option_group" "app" {
  name                 = "db-option-group"
  engine_name          = "postgres"
  major_engine_version = "17"
}

# DBを駆動させるサブネット
resource "aws_db_subnet_group" "app" {
  name = "db-sg"
  # マルチAZの設定をするため、異なるアベイラビリティゾーンを含める
  subnet_ids = [aws_subnet.private_0.id, aws_subnet.private_1.id]
}

# DBインスタンス
resource "aws_db_instance" "scalable-todo-db" {
  identifier = "scalable-todo-db"
  # An argument named "db_name" is not expected here. が出るのでコメントアウトしている
  # db_name    = "scalable-todo-db"

  engine         = "postgres"
  engine_version = "17"

  # todo: t3.microにする
  instance_class = "db.t3.micro"
  # instance_class = "db.t3.small"

  allocated_storage     = 20
  max_allocated_storage = 100
  # gp2は汎用SSD
  storage_type      = "gp2"
  storage_encrypted = true

  # kms_key_id = aws_kms_key.app.arn

  username = aws_ssm_parameter.db_username.value

  # このパスワードは使わず、以下のコマンド（例）で上書きする。ssmの/db/passwordと値を合わせる
  # aws rds modify-db-instance --db-instance-identifier 'scalable-todo-db' \
  # --master-user-password 'newPassword123!'
  # todo: ここSSMなど使えないのか確認
  password = "password"


  multi_az = false
  # falseでVPC外からのアクセスを遮断する
  publicly_accessible = false

  # バックアップの時間
  backup_window = "09:10-09:40"
  # バックアップ期間
  backup_retention_period = 30

  maintenance_window         = "mon:10:10-mon:10:40"
  auto_minor_version_upgrade = false

  # DB削除可能にする（一時的）
  deletion_protection = false
  skip_final_snapshot = true
  # DBを削除しない時だけ以下をコメント解除する
  # deletion_protection = true
  # skip_final_snapshot = false

  port = 5432

  # 設定変更のタイミング
  # RDSでは一部の設定に再起動が伴い、予期せぬダウンタイムが起こりえる。なのでfalseにして即時反映させない
  apply_immediately = false

  vpc_security_group_ids = [module.mysql_sg.security_group_id]

  parameter_group_name = aws_db_parameter_group.app.name
  option_group_name    = aws_db_option_group.app.name
  db_subnet_group_name = aws_db_subnet_group.app.name

  lifecycle {
    ignore_changes = [password]
  }
}

# DBインスタンスのsgの定義
# DBはVPC内からの通信のみ許可する
module "mysql_sg" {
  source      = "./security_group"
  name        = "postgres-sg"
  vpc_id      = aws_vpc.app.id
  port        = 5432
  cidr_blocks = [aws_vpc.app.cidr_block]
}


# ECRリポジトリ
resource "aws_ecr_repository" "app" {
  name = "app-repo"
}

# ECRライフサイクルポリシー
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = <<EOF
  {
    "rules":[
      {
        "rulePriority":1,
        "description":"keep last 30 release tagged images",
        "selection":{
          "tagStatus":"tagged",
          "tagPrefixList":["release"],
          "countType":"imageCountMoreThan",
          "countNumber":30
        },
        "action":{
          "type":"expire"
        }
      }
    ]
  }
  EOF
}
