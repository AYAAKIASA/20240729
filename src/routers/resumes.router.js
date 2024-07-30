const express = require('express');
const requireAccessToken = require('../middlewares/require-access-token.middleware');
const requireRoles = require('../middlewares/require-roles.middleware');
const { prisma } = require('../utils/prisma.util');
const router = express.Router();

// 이력서 생성 API
router.post('/', requireAccessToken, async (req, res) => {
  const { title, introduction } = req.body;
  const { user } = req;

  if (!title || !introduction) {
    return res.status(400).json({ message: '제목과 자기소개를 입력해 주세요' });
  }

  try {
    const resume = await prisma.resume.create({
      data: {
        title,
        introduction,
        status: 'APPLY',
        userId: user.id,
      },
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: '이력서 생성에 실패했습니다.' });
  }
});

// 이력서 목록 조회 API
router.get('/', requireAccessToken, async (req, res) => {
  const { user } = req;
  const { sort = 'desc' } = req.query;

  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: sort.toLowerCase() === 'asc' ? 'asc' : 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json(resumes.map(resume => ({
      id: resume.id,
      name: resume.user.name,
      title: resume.title,
      introduction: resume.introduction,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    })));
  } catch (error) {
    res.status(500).json({ message: '이력서 목록 조회에 실패했습니다.' });
  }
});

// 이력서 상세 조회 API
router.get('/:resumeId', requireAccessToken, async (req, res) => {
  const { user } = req;
  const { resumeId } = req.params;

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: parseInt(resumeId), userId: user.id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    res.status(200).json({
      id: resume.id,
      name: resume.user.name,
      title: resume.title,
      introduction: resume.introduction,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: '이력서 조회에 실패했습니다.' });
  }
});

// 이력서 수정 API
router.put('/:resumeId', requireAccessToken, async (req, res) => {
  const { user } = req;
  const { resumeId } = req.params;
  const { title, introduction } = req.body;

  if (!title && !introduction) {
    return res.status(400).json({ message: '수정 할 정보를 입력해 주세요.' });
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: parseInt(resumeId), userId: user.id },
    });

    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    const updatedResume = await prisma.resume.update({
      where: { id: parseInt(resumeId) },
      data: {
        title: title || resume.title,
        introduction: introduction || resume.introduction,
      },
    });

    res.status(200).json(updatedResume);
  } catch (error) {
    res.status(500).json({ message: '이력서 수정에 실패했습니다.' });
  }
});

// 이력서 삭제 API
router.delete('/:resumeId', requireAccessToken, async (req, res) => {
  const { user } = req;
  const { resumeId } = req.params;

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: parseInt(resumeId), userId: user.id },
    });

    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    await prisma.resume.delete({
      where: { id: parseInt(resumeId) },
    });

    res.status(200).json({ message: '이력서가 삭제되었습니다.', id: resumeId });
  } catch (error) {
    res.status(500).json({ message: '이력서 삭제에 실패했습니다.' });
  }
});

// 이력서 상태 변경 API
router.patch('/:resumeId/status', requireAccessToken, requireRoles(['RECRUITER']), async (req, res) => {
  const { resumeId } = req.params;
  const { status, reason } = req.body;
  const { user } = req; 

  if (!status) {
    return res.status(400).json({ message: '변경하고자 하는 지원 상태를 입력해 주세요.' });
  }
  if (!reason) {
    return res.status(400).json({ message: '지원 상태 변경 사유를 입력해 주세요.' });
  }

  const validStatuses = ['APPLY', 'DROP', 'PASS', 'INTERVIEW1', 'INTERVIEW2', 'FINAL_PASS'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: '유효하지 않은 지원 상태입니다.' });
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: parseInt(resumeId) },
    });

    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    const oldStatus = resume.status;

    await prisma.$transaction(async (prisma) => {
      await prisma.resume.update({
        where: { id: parseInt(resumeId) },
        data: { status },
      });

      await prisma.resumeLog.create({
        data: {
          resumeId: parseInt(resumeId),
          recruiterId: user.id,
          oldStatus,
          newStatus: status,
          reason,
        },
      });
    });

    res.status(200).json({
      message: '이력서 상태가 성공적으로 변경되었습니다.',
      resumeId,
      recruiterId: user.id,
      oldStatus,
      newStatus: status,
      reason,
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: '이력서 상태 변경에 실패했습니다.' });
  }
});

// 이력서 로그 목록 조회 API
router.get('/:resumeId/logs', requireAccessToken, requireRoles(['RECRUITER']), async (req, res) => {
  const { resumeId } = req.params;

  try {
    const logs = await prisma.resumeLog.findMany({
      where: { resumeId: parseInt(resumeId) },
      orderBy: { createdAt: 'desc' },
      include: {
        recruiter: {
          select: { name: true },
        },
      },
    });

    res.status(200).json(logs.map(log => ({
      id: log.id,
      recruiterName: log.recruiter.name,
      resumeId: log.resumeId,
      oldStatus: log.oldStatus,
      newStatus: log.newStatus,
      reason: log.reason,
      createdAt: log.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ message: '이력서 로그 조회에 실패했습니다.' });
  }
});

module.exports = router;