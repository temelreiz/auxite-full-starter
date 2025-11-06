#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="eu-central-1"

echo "› Clean & Build"
rm -rf .next out
pnpm build

echo "› out/ kontrol…"
[ -d out ] || { echo "out/ oluşmadı! (next.config.js output:'export'?)"; exit 1; }

echo "› CF dağıtım ve origin bucket’ı bul"
DIST_ID=$(aws cloudfront list-distributions \
  --query 'DistributionList.Items[?Aliases.Items && contains(Aliases.Items, `wallet.auxite.io`)].Id | [0]' \
  --output text)
ORIGIN_BUCKET_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" \
  --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' --output text)
BUCKET=$(echo "$ORIGIN_BUCKET_DOMAIN" | sed -E 's/\.s3[.-].*$//')

echo "› Statik dosyaları yükle (uzun cache)"
aws s3 sync ./out "s3://$BUCKET" \
  --delete --region "$AWS_REGION" \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "*.html" --exclude "index.txt"

echo "› HTML dosyaları yükle (kısa cache)"
aws s3 sync ./out "s3://$BUCKET" \
  --delete --region "$AWS_REGION" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "public,max-age=60" \
  --exclude "*" --include "*.html"

echo "› CloudFront invalidation"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" >/dev/null
echo "✓ Wallet yayınlandı."
