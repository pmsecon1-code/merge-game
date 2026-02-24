/**
 * 스토리 이미지를 WebP로 변환하는 일회성 스크립트
 *
 * 사용법: node scripts/convert-webp.js
 *
 * - scenes/ 24장: 800px 폭 리사이즈 + WebP quality 80
 * - boss 7장: 128px 유지 + WebP quality 85
 * - 변환 후 원본 .png 삭제
 */

import sharp from 'sharp';
import { readdir, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';

const STORY_DIR = join(import.meta.dirname, '..', 'images', 'story');
const SCENES_DIR = join(STORY_DIR, 'scenes');

async function convertFile(inputPath, width, quality) {
    const name = basename(inputPath, extname(inputPath));
    const outputPath = join(inputPath, '..', `${name}.webp`);

    await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outputPath);

    const inputStat = await sharp(inputPath).metadata();
    const outputStat = await sharp(outputPath).metadata();

    await unlink(inputPath);
    console.log(`  ${basename(inputPath)} → ${name}.webp (${inputStat.width}x${inputStat.height} → ${outputStat.width}x${outputStat.height})`);
}

async function main() {
    console.log('=== 스토리 이미지 WebP 변환 ===\n');

    // Boss 이미지 (128px, quality 85)
    console.log('[Boss 이미지]');
    const bossFiles = (await readdir(STORY_DIR))
        .filter(f => f.startsWith('boss_') && f.endsWith('.png'));

    for (const file of bossFiles) {
        await convertFile(join(STORY_DIR, file), 128, 85);
    }
    console.log(`  ${bossFiles.length}개 변환 완료\n`);

    // Scene 이미지 (800px, quality 80)
    console.log('[Scene 이미지]');
    const sceneFiles = (await readdir(SCENES_DIR))
        .filter(f => f.endsWith('.png'));

    for (const file of sceneFiles) {
        await convertFile(join(SCENES_DIR, file), 800, 80);
    }
    console.log(`  ${sceneFiles.length}개 변환 완료\n`);

    console.log('=== 변환 완료 ===');
}

main().catch(err => {
    console.error('변환 실패:', err);
    process.exit(1);
});
