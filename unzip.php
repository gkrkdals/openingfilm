<?php
/**
 * Next.js 정적 빌드 파일(out.zip) 웹호스팅 서버 원클릭 압축 해제 스크립트
 * 보안을 위해 압축 해제 성공 시 zip 파일과 이 php 파일은 자동 삭제됩니다.
 */

// 1. 압축 파일명 설정 (업로드할 zip 파일명과 일치해야 합니다)
$zipFileName = 'out.zip'; 

// 현재 PHP 파일이 있는 디렉토리 경로
$targetDir = __DIR__; 

echo "<h2>📦 가비아 호스팅 압축 해제 프로세스 시작</h2>";
echo "대상 파일: <strong>" . htmlspecialchars($zipFileName) . "</strong><br>";
echo "압축 해제 경로: <strong>" . htmlspecialchars($targetDir) . "</strong><br><br>";

// zip 파일이 존재하는지 확인
if (!file_exists($zipFileName)) {
    die("<span style='color:red;'>❌ 에러: " . htmlspecialchars($zipFileName) . " 파일이 존재하지 않습니다. 먼저 FTP로 zip 파일을 올려주세요.</span>");
}

// PHP ZipArchive 클래스 로드
$zip = new ZipArchive;

if ($zip->open($zipFileName) === TRUE) {
    // 2. 압축 해제 실행
    $zip->extractTo($targetDir);
    $zip->close();
    echo "<span style='color:green;'>✅ 1단계: 압축 해제가 완료되었습니다!</span><br>";

    // 3. 보안을 위한 자동 삭제 프로세스
    echo "🧹 2단계: 보안을 위해 설치 파일 정리를 시작합니다...<br>";
    
    // zip 파일 삭제
    if (unlink($zipFileName)) {
        echo " - " . htmlspecialchars($zipFileName) . " 파일 삭제 완료.<br>";
    } else {
        echo " - <span style='color:orange;'>⚠️ 경고: " . htmlspecialchars($zipFileName) . " 파일을 지우지 못했습니다. 수동으로 지워주세요.</span><br>";
    }

    // unzip.php 자기 자신 삭제
    $thisFile = __FILE__;
    echo " - 내포된 스크립트 파일 정리를 완료합니다.<br>";
    echo "<script>alert('압축 해제 및 보안 정리가 완료되었습니다!');</script>";
    
    // 이 스크립트가 완전히 끝나기 직전 자기 자신 삭제
    unlink($thisFile);
    
} else {
    echo "<span style='color:red;'>❌ 에러: 압축 파일을 열 수 없습니다. 파일이 손상되었거나 권한이 부족할 수 있습니다.</span>";
}
?>