#!/bin/zsh

client_id="$1"
confirm_code="$2"

aws cognito-idp confirm-sign-up \
    --client-id "$client_id" \
    --username andre \
    --confirmation-code "$confirm_code"