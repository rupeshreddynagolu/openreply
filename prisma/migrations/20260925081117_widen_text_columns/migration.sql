-- AlterTable
ALTER TABLE `Account` MODIFY `refresh_token` TEXT NULL,
    MODIFY `access_token` TEXT NULL,
    MODIFY `id_token` TEXT NULL;

-- AlterTable
ALTER TABLE `Automation` MODIFY `postUrl` TEXT NULL,
    MODIFY `dmMessage` TEXT NOT NULL,
    MODIFY `openingDmMessage` TEXT NULL,
    MODIFY `followPromptMessage` TEXT NULL,
    MODIFY `followUpMessage` TEXT NULL,
    MODIFY `publicReplyMessage` TEXT NULL;

-- AlterTable
ALTER TABLE `DmLog` MODIFY `commentText` TEXT NOT NULL,
    MODIFY `errorMessage` TEXT NULL,
    MODIFY `publicReplyError` TEXT NULL;

-- AlterTable
ALTER TABLE `InstagramAccount` MODIFY `accessToken` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `LinkClick` MODIFY `userAgent` TEXT NULL;

-- AlterTable
ALTER TABLE `OperationalEvent` MODIFY `message` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `TrackedLink` MODIFY `destinationUrl` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `WebhookEvent` MODIFY `errorMessage` TEXT NULL;
