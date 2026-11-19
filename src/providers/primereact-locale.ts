import { addLocale, locale } from "primereact/api";

// Korean texts for PrimeReact's own built-in strings (not part of the app's screens):
// Paginator (aria labels), Dropdown (empty messages), Dialog / ConfirmDialog (close, accept, reject),
// Checkbox / InputSwitch (aria labels) and FileUpload (in case one is added).
// Registered once; the terms follow docs/ko-glossary.md.
let registered = false;

export function registerKoreanLocale() {
  if (registered) return;
  registered = true;

  addLocale("ko", {
    // Dialog, ConfirmDialog, buttons
    accept: "예",
    reject: "아니오",
    choose: "파일 선택",
    upload: "업로드",
    cancel: "취소",
    close: "닫기",
    clear: "초기화",
    apply: "적용",
    // Dropdown and other lists
    emptyMessage: "검색 결과가 없습니다",
    emptyFilterMessage: "검색 결과가 없습니다",
    noFilter: "필터 없음",
    // Screen-reader labels
    aria: {
      trueLabel: "예",
      falseLabel: "아니오",
      nullLabel: "선택되지 않음",
      selectAll: "전체 선택됨",
      unselectAll: "전체 선택 해제됨",
      close: "닫기",
      previous: "이전",
      next: "다음",
      navigation: "탐색",
      pageLabel: "{page}페이지",
      firstPageLabel: "첫 페이지",
      lastPageLabel: "마지막 페이지",
      nextPageLabel: "다음 페이지",
      previousPageLabel: "이전 페이지",
      rowsPerPageLabel: "페이지당 행 수",
      jumpToPageDropdownLabel: "페이지 이동 선택",
      jumpToPageInputLabel: "페이지 이동 입력",
    },
  });
  locale("ko");
}
