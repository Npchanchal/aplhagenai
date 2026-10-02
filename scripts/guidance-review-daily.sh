#!/usr/bin/env bash
# Retired. Daily guidance review runs in the API process when
# INTELLENS_GUIDANCE_REVIEW=1 (02:30 IST). This file remains so an older
# crontab line cannot start a second review.
echo "guidance review runs in the API process; this script does nothing" >&2
exit 0
