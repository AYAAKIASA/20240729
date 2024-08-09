-- DropForeignKey
ALTER TABLE `resumelog` DROP FOREIGN KEY `ResumeLog_recruiterId_fkey`;

-- DropForeignKey
ALTER TABLE `resumelog` DROP FOREIGN KEY `ResumeLog_resumeId_fkey`;

-- AddForeignKey
ALTER TABLE `ResumeLog` ADD CONSTRAINT `ResumeLog_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `Resume`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResumeLog` ADD CONSTRAINT `ResumeLog_recruiterId_fkey` FOREIGN KEY (`recruiterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
