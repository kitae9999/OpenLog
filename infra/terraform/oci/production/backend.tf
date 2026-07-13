terraform {
  backend "oci" {
    bucket              = "openlog-terraform-state"
    namespace           = "nrmx0ag4fibk"
    key                 = "openlog/production/terraform.tfstate"
    region              = "ap-tokyo-1"
    auth                = "APIKey"
    config_file_profile = "DEFAULT"
  }
}
