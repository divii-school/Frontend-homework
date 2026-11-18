'use client';

import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import styles from './login-form.module.scss';

/** Talking Club's public site, where "토킹클럽 홈으로" leads (Figma 권한없음 팝업). */
const TALKING_CLUB_HOME = 'https://www.talkingclub.co.kr';

/** Shown when the account logged in but may use none of the shopping screens. */
export function NoPermissionDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Dialog
      visible={visible}
      onHide={onClose}
      showHeader={false}
      modal
      dismissableMask
      className={styles['no-permission']}
      aria-labelledby="no-permission-text"
    >
      <div className={styles['no-permission-body']}>
        <Image src="/images/logo-talkingclub.png" alt="토킹클럽" width={158} height={30} />
        <p id="no-permission-text">
          관리자 권한이 없습니다.
          <br />
          고객센터로 문의해주세요.
          <br />
          02-2014-8374
        </p>
        <a className={styles['login-button']} href={TALKING_CLUB_HOME}>
          토킹클럽 홈으로
        </a>
        <button type="button" className={styles['text-button']} onClick={onClose}>
          닫기
        </button>
      </div>
    </Dialog>
  );
}
