#!/bin/zsh

user_pool_id="$1"
client_id="$2"
username="$3"


aws cognito-idp admin-initiate-auth \
    --user-pool-id "$user_pool_id" \
    --client-id "$client_id" \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --auth-parameters USERNAME="$username",PASSWORD=Password123!