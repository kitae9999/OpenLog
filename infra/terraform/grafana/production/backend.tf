terraform {
  backend "oci" {
    bucket              = "openlog-terraform-state"
    namespace           = "nrmx0ag4fibk"
    region              = "ap-tokyo-1"
    key                 = "openlog/grafana-production/terraform.tfstate"
    auth                = "APIKey"
    config_file_profile = "DEFAULT"
  }
}
