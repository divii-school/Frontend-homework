import Link from "next/link";
import { StateBlock } from "@/components/common/StateBlock";
import { ROUTES } from "@/constants/routes";

/** 404 for any URL that is not a page of this app. */
export default function NotFound() {
  return (
    <main className="login-page">
      <StateBlock
        kind="not-found"
        title="페이지를 찾을 수 없습니다. (404)"
        description="주소가 바뀌었거나 삭제된 페이지입니다."
        action={
          <Link className="link-button link-button-primary" href={ROUTES.home}>
            상품 관리로 이동
          </Link>
        }
      />
    </main>
  );
}
