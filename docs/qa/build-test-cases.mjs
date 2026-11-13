// Builds docs/qa/HW3-Pranesh-unit-test-cases.csv (UTF-8 with BOM, opens in Google Sheets / Excel).
// Run: node docs/qa/build-test-cases.mjs
import { writeFileSync } from 'node:fs';

const H = ['TC ID', '화면', '기능 영역', '구분', '우선순위', '사전 조건', '테스트 절차', '테스트 데이터', '기대 결과', 'Playwright', '결과', '비고'];
const P = 'Positive';
const N = 'Negative';
const LOGIN = '로그아웃 상태';
const IN = 'QA 관리자 계정(DM) 로그인 상태';

// [screen, area, type, priority, precondition, steps, data, expected, playwright]
const cases = [
  // 로그인
  ['로그인', '화면 진입', P, 'High', LOGIN, '1) /login 접속', '-', '브라우저 탭 제목 "로그인 | 토킹클럽 관리자", Figma 1.1.0 로그인 화면(로고, 아이디, 비밀번호, 자동 로그인, 로그인 버튼) 표시', 'auth.spec · a protected page…'],
  ['로그인', '버튼 활성화', N, 'High', LOGIN, '1) 아이디만 입력 2) 로그인 버튼 확인', '아이디: DM으로 받은 QA 계정', '아이디·비밀번호 모두 입력 전까지 로그인 버튼 비활성', 'auth.spec · a protected page…'],
  ['로그인', '로그인 성공', P, 'High', LOGIN, '1) 아이디·비밀번호 입력 2) 로그인', 'DM 계정', '상품 관리(/shopping/products)로 이동, 헤더에 이름 표시', 'auth.setup'],
  ['로그인', '비밀번호 오류', N, 'High', LOGIN, '1) 올바른 아이디 + 틀린 비밀번호 2) 로그인', 'wrong-password', '비밀번호 아래 "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요." 표시, 페이지 유지', 'auth.spec · wrong password…'],
  ['로그인', '미등록 아이디', N, 'High', LOGIN, '1) 없는 아이디 2) 로그인', 'hw3_pranesh_no_such_user', '아이디 아래 "등록되지 않은 계정입니다." 표시', 'auth.spec · unknown ID…'],
  ['로그인', '공백 입력', N, 'Medium', LOGIN, '1) 아이디에 공백만 입력 2) 비밀번호 입력', '"   "', '로그인 버튼 비활성(앞뒤 공백 제거 후 판단)', '-'],
  ['로그인', '비밀번호 보기', P, 'Low', LOGIN, '1) 비밀번호 입력 2) 눈 아이콘 클릭', '-', '입력한 비밀번호가 보이고, 다시 누르면 가려짐', 'auth.spec · show/hide password'],
  ['로그인', '자동 로그인', P, 'Medium', LOGIN, '1) 자동 로그인 체크 후 로그인 2) 브라우저 종료 후 재실행', '-', '체크 시 브라우저를 닫아도 로그인 유지(최대 7일), 미체크 시 브라우저 종료와 함께 로그아웃', '-'],
  ['로그인', '네트워크 오류', N, 'Medium', LOGIN, '1) 네트워크 차단 후 로그인', '-', '"서버에 연결할 수 없습니다…" 안내, 입력값 유지', 'auth.spec · server unreachable…'],
  ['로그인', '권한 없음 팝업', N, 'High', '쇼핑몰 권한이 없는 관리자 계정', '1) 로그인', '권한 없는 계정', '"관리자 권한이 없습니다. 고객센터로 문의해주세요. 02-2014-8374" 팝업, [토킹클럽 홈으로] 링크', 'roles.spec · an admin with no shopping permission…'],
  // 인증·권한
  ['공통', '라우트 가드', N, 'High', LOGIN, '1) /shopping/categories?q=Shop 직접 접속', '-', '/login?returnTo=… 로 이동, 로그인 후 같은 주소(q 포함)로 복귀', 'auth.spec · a protected page…'],
  ['공통', '세션 만료', N, 'High', IN, '1) 다른 곳에서 로그아웃되어 토큰 만료 2) 화면 조작', '-', '토큰 재발급 실패 시 "로그인이 만료되었습니다" 안내와 함께 로그인 화면, 로그인 후 원래 페이지로 복귀', 'auth.spec · 401 + failed refresh…'],
  ['공통', '토큰 재발급', P, 'High', IN, '1) 액세스 토큰 만료 상태에서 목록 조회', '-', '자동으로 재발급 후 요청 재시도, 화면 정상 표시(로그인 화면으로 가지 않음)', 'auth.spec · 401 + successful refresh…'],
  ['공통', '로그아웃', P, 'High', IN, '1) 헤더 로그아웃 아이콘 클릭 2) /shopping/products 접속', '-', '로그인 화면으로 이동, 보호 페이지 접근 시 다시 로그인 요구', 'auth.spec · logout clears…'],
  ['공통', '역할별 메뉴', P, 'High', '상품 관리 권한만 있는 계정', '1) 로그인 2) 사이드 메뉴 확인', '-', '상품 관리 메뉴만 표시, 상품 카테고리 관리 메뉴 없음', 'roles.spec · a role with only 상품 관리…'],
  ['공통', '403 화면', N, 'High', '상품 관리 권한만 있는 계정', '1) /shopping/categories 직접 접속', '-', '"403 · 접근 권한이 없습니다." 표시, 주소는 유지, 데이터 미조회', 'roles.spec · a role with only 상품 관리…'],
  ['공통', '403 화면', N, 'High', '카테고리 권한만 있는 계정', '1) /shopping/products/20001/edit 직접 접속', '-', '403 화면, 상품 관리 메뉴 없음', 'roles.spec · a role with only 카테고리 관리…'],
  ['공통', '외부 이동 차단', N, 'Medium', IN, '1) /login?returnTo=https://evil.example 접속', '-', '외부 사이트로 이동하지 않고 상품 관리로 이동', 'roles.spec · returnTo cannot…'],
  ['공통', '없는 주소', N, 'Low', IN, '1) /shopping/products/abc 접속', '-', '"404 · 페이지를 찾을 수 없습니다." 와 상품 관리 이동 버튼', 'products.spec · unknown or invalid…'],
  // 카테고리
  ['상품 카테고리 관리', '목록', P, 'High', IN, '1) 메뉴 > 상품 카테고리 관리', '-', '대분류 12개 모두 표시, 각 대분류에 "(n개 중분류)" 표시', 'categories.spec · shows every 대분류…'],
  ['상품 카테고리 관리', '펼치기/접기', P, 'Medium', IN, '1) 학원 Shop 펼치기 2) 모두 펼치기 3) 모두 접기', '-', '하위 노드 표시/숨김, 레벨별 배지 색상 구분', 'categories.spec · 모두 펼치기…'],
  ['상품 카테고리 관리', '검색', P, 'High', IN, '1) 검색어 입력 후 엔터/검색 2) 새로고침', 'HW3-Pranesh', '일치하는 가지가 펼쳐진 채 표시, URL ?q= 유지, 새로고침 후에도 동일', 'categories.spec · search lives…'],
  ['상품 카테고리 관리', '검색 결과 없음', N, 'Medium', IN, '1) 없는 검색어 검색', 'zz-no-such-category', '"검색 결과가 없습니다." 표시', 'categories.spec · no result…'],
  ['상품 카테고리 관리', '대분류 등록 제한', N, 'Medium', 'API isCreatable=false', '1) 대분류 등록 버튼 확인', '-', '버튼 비활성 + 툴팁/안내 "대분류 개수가 최대치에 도달하여…"', 'categories.spec · 대분류 등록 is disabled…'],
  ['상품 카테고리 관리', '하위 등록', P, 'High', IN, '1) HW3-Pranesh-Sub 행 [+ 소분류] 2) 이름 입력 후 등록', '"  HW3-Pranesh-E2E-xxx  "', '앞뒤 공백 제거되어 등록, "소분류가 등록되었습니다." 토스트, 트리 즉시 갱신', 'categories.mutation.spec'],
  ['상품 카테고리 관리', '빈 이름', N, 'High', IN, '1) 등록 모달에서 공백만 입력 후 등록', '"   "', '"카테고리명을 입력해 주세요." 표시, API 호출 없음', 'categories.spec · empty name…'],
  ['상품 카테고리 관리', '이름 길이', N, 'Low', IN, '1) 51자 이상 입력 후 등록', '51자', '"카테고리명은 50자 이하로 입력해 주세요." 표시', '-'],
  ['상품 카테고리 관리', '수정', P, 'High', IN, '1) 연필 아이콘 2) 이름 변경 후 저장', 'HW3-Pranesh-E2E-xxx-수정', '현재 이름이 채워진 모달, 저장 후 "소분류가 수정되었습니다." 토스트', 'categories.mutation.spec'],
  ['상품 카테고리 관리', '삭제 확인', P, 'High', IN, '1) 휴지통 2) 취소 3) 다시 휴지통 4) 삭제', '본인 소분류', '취소 시 유지, 삭제 시 "되돌릴 수 없습니다" 확인 후 삭제 및 토스트', 'categories.mutation.spec'],
  ['상품 카테고리 관리', '하위 있는 삭제', N, 'High', IN, '1) 하위가 있는 노드의 휴지통', '학원 Shop', '"하위 카테고리 n개가 있어 삭제할 수 없습니다." 안내, 삭제 안 됨', 'categories.spec · a category with children…'],
  ['상품 카테고리 관리', 'API 오류', N, 'Medium', IN, '1) 카테고리 API 500 상태로 진입 2) 다시 시도', '-', '"카테고리를 불러오지 못했습니다." + 다시 시도 버튼, 재시도 시 정상 표시', 'categories.spec · API failure…'],
  ['상품 카테고리 관리', '정렬(드래그)', P, 'Low', '형제가 모두 HW3-Pranesh-* 인 그룹', '1) 드래그 핸들로 순서 변경(또는 핸들에서 ↑/↓ 키)', '-', '순서 변경 저장 토스트. 다른 사람 데이터가 섞인 그룹은 핸들 미표시(공용 QA 데이터 보호)', '-'],
  // 상품 목록
  ['상품 관리', '목록', P, 'High', IN, '1) 메뉴 > 상품 관리', '-', '10건/페이지, 총 게시물 수, 썸네일(없으면 회색), ₩ 판매가, 대>중>소 카테고리, 노출 여부, 등록일 YYYY/MM/DD HH:MM', 'products.spec · loads a page of 10…'],
  ['상품 관리', '검색(상품명)', P, 'High', IN, '1) 상품명 선택 2) 검색어 입력 후 검색', '토킹클럽', '결과만 표시, URL ?q= 반영', 'products.spec · search, type and page…'],
  ['상품 관리', '검색(카테고리)', P, 'Medium', IN, '1) 카테고리 선택 2) 검색', 'HW3-Pranesh-Child', '해당 카테고리 상품 표시, URL ?type=categoryName', 'products.spec · category search type'],
  ['상품 관리', '검색 결과 없음', N, 'Medium', IN, '1) 없는 검색어 검색', 'zz-no-such-product', '"검색 결과가 없습니다." + 총 게시물 0건', 'products.spec · empty search…'],
  ['상품 관리', '페이지 이동', P, 'High', IN, '1) 2페이지 클릭 2) 새로고침 3) 뒤로가기', '-', 'URL page=2 유지, 새로고침 후 같은 데이터, 뒤로가기 시 이전 페이지', 'products.spec · search, type and page…'],
  ['상품 관리', '잘못된 URL', N, 'Low', IN, '1) ?page=-4&size=9999&type=hack 접속', '-', '오류 없이 기본값(1페이지, 10건)으로 표시', 'products.spec · a bad URL…'],
  ['상품 관리', '선택·일괄 삭제', P, 'High', IN, '1) 행 체크 2) 삭제 (n) 3) 취소', 'HW3 상품', '확인 팝업 "선택한 n개 상품을 삭제하시겠습니까?", 취소 시 삭제 안 됨', 'products.spec · selection enables…'],
  ['상품 관리', '선택 최대 100개', N, 'Medium', IN, '1) 50건/페이지로 3페이지 전체 선택', '-', '100개 초과 시 "한 번에 최대 100개까지 선택할 수 있습니다." 안내, 100개까지만 선택', '-'],
  ['상품 관리', '노출 여부 변경', P, 'High', IN, '1) 행의 노출 드롭다운에서 아니오 선택', 'HW3 상품', '즉시 저장 + "노출 여부가 변경되었습니다." 토스트', 'products.mutation.spec'],
  ['상품 관리', 'CSV 내보내기', P, 'Medium', IN, '1) 검색 후 CSV 내보내기', 'HW3-Pranesh', '현재 검색 결과 전체(모든 페이지)가 products_YYYYMMDDHHMM.csv 로 다운로드, 엑셀에서 한글 정상', 'products.spec · CSV export…'],
  ['상품 관리', 'API 오류 / 네트워크', N, 'High', IN, '1) 목록 API 500 2) 다시 시도 시 네트워크 끊김', '-', '"상품 목록을 불러오지 못했습니다." + 다시 시도, 네트워크 안내 문구', 'products.spec · API error…'],
  // 등록/수정
  ['상품 등록', '화면 진입', P, 'High', IN, '1) 등록 버튼', '-', '4단계(기본 정보 → 이미지·노출 → 카테고리 → ERP), 상품코드 자동 생성(읽기 전용)', 'products.mutation.spec · create…'],
  ['상품 등록', '1단계 필수값', N, 'High', IN, '1) 아무것도 입력하지 않고 다음', '-', '상품명/단가/판매가/상세설명 오류 표시, 다음 단계로 이동 안 함', 'products.mutation.spec · create…'],
  ['상품 등록', '단가 < 판매가', N, 'High', IN, '1) 단가 2,000 / 판매가 2,000 입력 후 다음', '2000/2000', '"단가는 판매가보다 작아야 합니다." (API 규칙과 동일, 같아도 불가)', 'products.mutation.spec · create… / unit test'],
  ['상품 등록', '금액 형식', N, 'Medium', IN, '1) 0 또는 소수 입력', '0, 1.5', '"0보다 커야 합니다" / 정수만 입력, 천 단위 콤마 자동 표시', 'product-form-schema.test.ts'],
  ['상품 등록', '상품명 길이', N, 'Medium', IN, '1) 101자 입력', '101자', '"상품명은 100자 이하로 입력해 주세요."', 'product-form-schema.test.ts'],
  ['상품 등록', '이미지 필수', N, 'High', IN, '1) 이미지 없이 다음', '-', '"대표 이미지를 1장 이상 등록해 주세요."', 'products.mutation.spec · create…'],
  ['상품 등록', '이미지 업로드(정상)', P, 'High', IN, '1) JPG/PNG/WEBP 4MB 이하 선택', 'HW3-Pranesh-e2e.png', '업로드 후 미리보기 + 대표 배지, (n/4) 표시', 'products.mutation.spec · create…'],
  ['상품 등록', '이미지 형식 오류', N, 'High', IN, '1) 텍스트 파일 선택', 'not-an-image.txt', '"JPG, PNG, WEBP 이미지만 등록할 수 있습니다." 업로드 안 됨', 'products.mutation.spec · create…'],
  ['상품 등록', '이미지 용량 초과', N, 'High', IN, '1) 4MB 초과 이미지 선택', '5MB jpg', '"4MB 이하 이미지만 등록할 수 있습니다." 업로드 안 됨', 'upload.test.ts'],
  ['상품 등록', '이미지 크기(권장 800×800)', N, 'Medium', IN, '1) 800×800 이 아닌 이미지 선택', '1200×600 png', '업로드는 진행되고 "1200×600px, 정사각형이 아님 — 권장 크기(800×800px)와 달라 잘리거나 흐리게 보일 수 있습니다." 안내 (Figma: 권장이므로 차단하지 않음)', 'upload.test.ts'],
  ['상품 등록', '손상된 이미지', N, 'Medium', IN, '1) 확장자만 .png 인 텍스트 파일 선택', 'fake.png', '"이미지 파일을 읽을 수 없습니다. 다른 파일을 선택해 주세요." 업로드 안 됨', '-'],
  ['상품 등록', '이미지 개수 초과', N, 'Medium', IN, '1) 5장 선택', '5장', '"최대 4장까지 등록할 수 있습니다" 안내, 앞 4장만 업로드, 파일 추가 비활성', 'product-form-schema.test.ts'],
  ['상품 등록', '이미지 삭제', P, 'Medium', IN, '1) 미리보기 X 버튼', '-', '해당 이미지 제거, 첫 번째 이미지가 대표', '-'],
  ['상품 등록', '카테고리 선택', P, 'High', IN, '1) 대분류 → 중분류 → 소분류 선택', '학원 Shop › HW3-Pranesh-Sub › HW3-Pranesh-Child', '앞 단계 선택 시 다음 열 로딩, 대분류 변경 시 아래 선택 초기화, 선택 경로 표시', 'products.mutation.spec · create…'],
  ['상품 등록', '카테고리 필수', N, 'High', IN, '1) 소분류 미선택 후 다음', '-', '"소분류를 선택해 주세요."', 'product-form-schema.test.ts'],
  ['상품 등록', '이전 시 값 유지', P, 'High', IN, '1) 4단계까지 입력 2) 이전 3회 3) 다시 다음', '-', '모든 단계 입력값 유지', 'products.mutation.spec · create…'],
  ['상품 등록', '등록 성공', P, 'High', IN, '1) 모든 단계 입력 후 등록', 'HW3-Pranesh-E2E-상품-xxx', '"상품이 등록되었습니다." 토스트, 목록으로 이동, 검색 시 표시', 'products.mutation.spec · create… / find it…'],
  ['상품 등록', 'API 오류 시 입력 유지', N, 'High', IN, '1) 저장 API 500 상태에서 등록', '-', '"저장하지 못했습니다. 입력한 내용은 그대로 유지됩니다." + 모든 값 유지', 'products.mutation.spec · an API error…'],
  ['상품 등록', '취소', P, 'Medium', IN, '1) 일부 입력 후 취소', '-', '"입력한 정보는 모두 삭제됩니다. 취소하시겠습니까?" 확인 후 목록으로', '-'],
  ['상품 등록', '중복 저장 방지', N, 'Medium', IN, '1) 등록 버튼 빠르게 2번 클릭', '-', '저장 중 버튼 로딩/비활성, 상품 1건만 생성', '-'],
  ['상품 수정', '기존 값 표시', P, 'High', IN, '1) 상세 > 수정', 'HW3 상품', '모든 단계에 기존 값, 카테고리는 읽기 전용("등록 후 수정할 수 없습니다")', 'products.mutation.spec · find it…'],
  ['상품 수정', '수정 저장', P, 'High', IN, '1) 판매가 변경 후 저장', '3,000', '"상품이 수정되었습니다." 상세 화면에 ₩3,000', 'products.mutation.spec · find it…'],
  // 상세
  ['상품 상세', '탭', P, 'High', IN, '1) 목록에서 상품명 클릭 2) 탭 이동 3) 새로고침', '-', '기본 정보/이미지/ERP 정보/같은 카테고리 상품, 선택 탭 URL(?tab=) 유지, 열 때 데이터 로딩', 'products.spec · tabs…'],
  ['상품 상세', '탭 키보드', P, 'Low', IN, '1) 탭에서 ←/→ 키', '-', '이전/다음 탭으로 이동', 'products.spec · tabs…'],
  ['상품 상세', '탭별 빈 상태', N, 'Medium', IN, '1) 같은 소분류에 다른 상품이 없는 상품의 4번째 탭', 'HW3 프로브 상품', '"같은 카테고리에 다른 상품이 없습니다."', '-'],
  ['상품 상세', '같은 카테고리 상품', P, 'Medium', IN, '1) 같은 소분류에 상품이 여러 개인 상품의 4번째 탭', '-', '같은 소분류 상품 n건(현재 상품 포함) 목록, 현재 상품은 "현재 상품" 표시, 이름 클릭 시 해당 상세로 이동, 10건 초과 시 페이지 이동', 'products.spec · related tab lists…'],
  ['상품 상세', '탭별 오류', N, 'Medium', IN, '1) 같은 카테고리 API 500 2) 이미지 탭 이동', '-', '해당 탭만 오류 + 다시 시도, 다른 탭은 정상', 'products.spec · a tab that fails…'],
  ['상품 상세', '없는 상품', N, 'Medium', IN, '1) /shopping/products/99999999', '-', '"상품을 찾을 수 없습니다."', 'products.spec · unknown or invalid…'],
  ['상품 상세', '목록 복귀', P, 'Medium', IN, '1) 검색 후 상세 진입 2) 목록', '?q=HW3-Pranesh', '같은 검색·페이지의 목록으로 복귀', 'products.spec · 목록 returns…'],
  ['상품 상세', '삭제', P, 'High', IN, '1) 삭제 2) 확인', 'HW3 상품', '삭제 토스트, 목록으로 이동, 검색 시 없음', 'products.mutation.spec · find it…'],
  // 공통 품질
  ['공통', '다크 모드', P, 'Medium', IN, '1) 헤더 달/해 아이콘', '-', '모든 화면 색상 토큰으로 전환, 새로고침 후에도 유지, 첫 화면 깜빡임 없음', '-'],
  ['공통', '반응형 1920', P, 'Medium', IN, '1) 1920px 에서 각 화면', '-', '콘텐츠가 1440 디자인 폭 기준으로 정렬, 늘어나 깨지거나 빈 공간 어색함 없음', 'screenshots'],
  ['공통', '반응형 1366', P, 'Medium', IN, '1) 1366px 에서 각 화면', '-', '사이드 메뉴 + 본문 레이아웃 유지, 표는 영역 안에서만 가로 스크롤', 'screenshots'],
  ['공통', '반응형 1440', P, 'High', IN, '1) 1440px 에서 각 화면', '-', 'Figma 1440 레이아웃과 동일, 가로 스크롤 없음', 'screenshots'],
  ['공통', '반응형 768', P, 'High', IN, '1) 768px 에서 각 화면', '-', '사이드 메뉴는 ☰ 드로어, 표는 표 영역 안에서만 가로 스크롤, 페이지 가로 스크롤 없음', 'screenshots'],
  ['공통', '반응형 375', P, 'High', IN, '1) 375px 에서 각 화면', '-', '버튼·입력 1열 배치, 잘림/겹침 없음, 표는 영역 내 스크롤', 'screenshots'],
  ['공통', '키보드 접근성', P, 'Medium', IN, '1) Tab 으로 모든 화면 조작', '-', '포커스 링 표시, 메뉴/드롭다운/모달/탭 키보드 조작 가능, 본문 바로가기 링크', '-'],
  ['공통', '웹 접근성 자동 검사', P, 'Medium', IN, '1) axe WCAG A/AA 검사', '-', '위반 0건', 'products.spec · no accessibility violations'],
  ['공통', '콘솔 오류', P, 'Medium', IN, '1) 모든 화면에서 개발자 도구 콘솔 확인', '-', '오류·경고 0건', '-'],
];

const csvCell = (v) => {
  const t = String(v ?? '');
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const prefix = { 로그인: 'LOGIN', 공통: 'COMMON', '상품 카테고리 관리': 'CAT', '상품 관리': 'PRD-LIST', '상품 등록': 'PRD-FORM', '상품 수정': 'PRD-EDIT', '상품 상세': 'PRD-DETAIL' };
const counters = {};
const rows = cases.map(([screen, area, type, priority, pre, steps, data, expected, pw]) => {
  counters[screen] = (counters[screen] ?? 0) + 1;
  const id = `TC-${prefix[screen]}-${String(counters[screen]).padStart(2, '0')}`;
  return [id, screen, area, type, priority, pre, steps, data, expected, pw, '', ''];
});
const csv = [H, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
writeFileSync(new URL('./HW3-Pranesh-unit-test-cases.csv', import.meta.url), '﻿' + csv);
const pos = rows.filter((r) => r[3] === P).length;
console.log(`${rows.length} cases (${pos} positive, ${rows.length - pos} negative)`);
