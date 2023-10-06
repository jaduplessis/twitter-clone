#!/bin/zsh

client_id="$1"
username="$2"

aws cognito-idp sign-up \
  --client-id "$client_id" \
  --username "$username" \
  --password Password123! \
  --user-attributes Name=name,Value=test_user \
                   Name=email,Value=andreddp@aleios.com


