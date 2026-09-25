-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` VARCHAR(191) NULL,
    `access_token` VARCHAR(191) NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` VARCHAR(191) NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workspace` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `usagePeriodStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dmsSentThisPeriod` INTEGER NOT NULL DEFAULT 0,

    INDEX `Workspace_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkspaceMember` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'OWNER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkspaceMember_userId_idx`(`userId`),
    UNIQUE INDEX `WorkspaceMember_workspaceId_userId_key`(`workspaceId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkspaceInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `invitedByUserId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WorkspaceInvitation_token_key`(`token`),
    INDEX `WorkspaceInvitation_email_idx`(`email`),
    INDEX `WorkspaceInvitation_workspaceId_idx`(`workspaceId`),
    INDEX `WorkspaceInvitation_status_idx`(`status`),
    UNIQUE INDEX `WorkspaceInvitation_workspaceId_email_key`(`workspaceId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstagramAccount` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `instagramId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `webhookSubscribed` BOOLEAN NOT NULL DEFAULT false,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InstagramAccount_instagramId_key`(`instagramId`),
    INDEX `InstagramAccount_workspaceId_idx`(`workspaceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowerSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `instagramAccountId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `followersCount` INTEGER NOT NULL,
    `backfilled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FollowerSnapshot_instagramAccountId_date_idx`(`instagramAccountId`, `date`),
    UNIQUE INDEX `FollowerSnapshot_instagramAccountId_date_key`(`instagramAccountId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Automation` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `instagramAccountId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `goal` VARCHAR(191) NULL,
    `postId` VARCHAR(191) NULL,
    `postUrl` VARCHAR(191) NULL,
    `pendingNextReel` BOOLEAN NOT NULL DEFAULT false,
    `matchAnyPost` BOOLEAN NOT NULL DEFAULT false,
    `keywords` JSON NOT NULL,
    `matchAnyWord` BOOLEAN NOT NULL DEFAULT false,
    `dmTriggerEnabled` BOOLEAN NOT NULL DEFAULT false,
    `dmMessage` VARCHAR(191) NOT NULL,
    `openingDmEnabled` BOOLEAN NOT NULL DEFAULT false,
    `openingDmMessage` VARCHAR(191) NULL,
    `openingDmButtonLabel` VARCHAR(191) NULL,
    `linkButtonLabel` VARCHAR(191) NULL,
    `requireFollow` BOOLEAN NOT NULL DEFAULT false,
    `followPromptMessage` VARCHAR(191) NULL,
    `followPromptButtonLabel` VARCHAR(191) NULL,
    `followUpEnabled` BOOLEAN NOT NULL DEFAULT false,
    `followUpMessage` VARCHAR(191) NULL,
    `followUpDelayMinutes` INTEGER NOT NULL DEFAULT 0,
    `publicReplyEnabled` BOOLEAN NOT NULL DEFAULT false,
    `publicReplyMessage` VARCHAR(191) NULL,
    `publicReplyMessages` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `wholeWordMatch` BOOLEAN NOT NULL DEFAULT true,
    `reportShareSlug` VARCHAR(191) NULL,
    `reportShareEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Automation_reportShareSlug_key`(`reportShareSlug`),
    INDEX `Automation_workspaceId_idx`(`workspaceId`),
    INDEX `Automation_instagramAccountId_idx`(`instagramAccountId`),
    INDEX `Automation_postId_idx`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DmLog` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `automationId` VARCHAR(191) NOT NULL,
    `instagramAccountId` VARCHAR(191) NOT NULL,
    `commenterId` VARCHAR(191) NOT NULL,
    `commenterName` VARCHAR(191) NULL,
    `commentText` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(191) NOT NULL,
    `matchedKeyword` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED_DEDUP', 'SKIPPED_RATE_LIMIT', 'SKIPPED_PLAN_LIMIT', 'SKIPPED_NO_MATCH') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `dmSentAt` DATETIME(3) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `publicReplySentAt` DATETIME(3) NULL,
    `publicReplyError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DmLog_workspaceId_idx`(`workspaceId`),
    INDEX `DmLog_automationId_idx`(`automationId`),
    INDEX `DmLog_instagramAccountId_idx`(`instagramAccountId`),
    INDEX `DmLog_status_idx`(`status`),
    UNIQUE INDEX `DmLog_automationId_commentId_key`(`automationId`, `commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessedComment` (
    `id` VARCHAR(191) NOT NULL,
    `instagramAccountId` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `seenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProcessedComment_commentId_key`(`commentId`),
    INDEX `ProcessedComment_instagramAccountId_idx`(`instagramAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrackedLink` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `automationId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `destinationUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TrackedLink_slug_key`(`slug`),
    INDEX `TrackedLink_workspaceId_idx`(`workspaceId`),
    INDEX `TrackedLink_automationId_idx`(`automationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LinkClick` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `automationId` VARCHAR(191) NOT NULL,
    `instagramAccountId` VARCHAR(191) NOT NULL,
    `trackedLinkId` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LinkClick_workspaceId_idx`(`workspaceId`),
    INDEX `LinkClick_automationId_idx`(`automationId`),
    INDEX `LinkClick_instagramAccountId_idx`(`instagramAccountId`),
    INDEX `LinkClick_trackedLinkId_idx`(`trackedLinkId`),
    INDEX `LinkClick_createdAt_idx`(`createdAt`),
    INDEX `LinkClick_workspaceId_createdAt_idx`(`workspaceId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NULL,
    `object` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `WebhookEvent_workspaceId_idx`(`workspaceId`),
    INDEX `WebhookEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperationalEvent` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NULL,
    `source` ENUM('WORKER', 'TOKEN_REFRESH', 'HEALTH', 'SYSTEM') NOT NULL,
    `level` ENUM('INFO', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `message` VARCHAR(191) NOT NULL,
    `payload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `OperationalEvent_workspaceId_idx`(`workspaceId`),
    INDEX `OperationalEvent_source_idx`(`source`),
    INDEX `OperationalEvent_level_idx`(`level`),
    INDEX `OperationalEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Workspace` ADD CONSTRAINT `Workspace_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceInvitation` ADD CONSTRAINT `WorkspaceInvitation_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceInvitation` ADD CONSTRAINT `WorkspaceInvitation_invitedByUserId_fkey` FOREIGN KEY (`invitedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstagramAccount` ADD CONSTRAINT `InstagramAccount_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowerSnapshot` ADD CONSTRAINT `FollowerSnapshot_instagramAccountId_fkey` FOREIGN KEY (`instagramAccountId`) REFERENCES `InstagramAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Automation` ADD CONSTRAINT `Automation_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Automation` ADD CONSTRAINT `Automation_instagramAccountId_fkey` FOREIGN KEY (`instagramAccountId`) REFERENCES `InstagramAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DmLog` ADD CONSTRAINT `DmLog_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DmLog` ADD CONSTRAINT `DmLog_automationId_fkey` FOREIGN KEY (`automationId`) REFERENCES `Automation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DmLog` ADD CONSTRAINT `DmLog_instagramAccountId_fkey` FOREIGN KEY (`instagramAccountId`) REFERENCES `InstagramAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackedLink` ADD CONSTRAINT `TrackedLink_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackedLink` ADD CONSTRAINT `TrackedLink_automationId_fkey` FOREIGN KEY (`automationId`) REFERENCES `Automation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkClick` ADD CONSTRAINT `LinkClick_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkClick` ADD CONSTRAINT `LinkClick_automationId_fkey` FOREIGN KEY (`automationId`) REFERENCES `Automation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkClick` ADD CONSTRAINT `LinkClick_instagramAccountId_fkey` FOREIGN KEY (`instagramAccountId`) REFERENCES `InstagramAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkClick` ADD CONSTRAINT `LinkClick_trackedLinkId_fkey` FOREIGN KEY (`trackedLinkId`) REFERENCES `TrackedLink`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookEvent` ADD CONSTRAINT `WebhookEvent_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalEvent` ADD CONSTRAINT `OperationalEvent_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
