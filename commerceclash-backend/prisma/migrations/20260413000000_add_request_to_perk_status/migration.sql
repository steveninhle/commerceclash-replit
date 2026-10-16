-- AlterEnum: add 'request' value to perk_status
ALTER TYPE "perk_status" ADD VALUE IF NOT EXISTS 'request' BEFORE 'pending';
