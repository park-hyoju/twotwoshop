export interface LegalDocumentTable {
  headers: string[]
  rows: string[][]
}

export interface LegalDocumentSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
  table?: LegalDocumentTable
}

export interface LegalDocumentContent {
  title: string
  sections: LegalDocumentSection[]
}

export const TERMS_OF_SERVICE: LegalDocumentContent = {
  title: '이용약관',
  sections: [
    {
      title: '목적',
      paragraphs: [
        '본 약관은 투투샵(TWOTWOSHOP)이 제공하는 쇼핑몰 서비스의 이용과 관련하여 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
      ],
    },
    {
      title: '회원가입',
      paragraphs: [
        '회원은 본 약관에 동의하고 필요한 정보를 입력하여 회원가입을 신청할 수 있습니다.',
      ],
    },
    {
      title: '주문 및 결제',
      paragraphs: [
        '회원은 쇼핑몰에서 상품을 주문할 수 있으며, 회사가 제공하는 결제 수단을 이용하여 결제를 진행합니다.',
      ],
    },
    {
      title: '배송',
      paragraphs: [],
      bullets: [
        '상품은 결제 확인 후 순차적으로 배송됩니다.',
        '배송 일정은 재고 상황 및 택배사 사정에 따라 변경될 수 있습니다.',
      ],
    },
    {
      title: '교환 및 환불',
      paragraphs: [],
      bullets: [
        '상품 수령 후 3일 이내 교환 및 반품 신청이 가능합니다.',
        '상품 훼손, 사용 흔적, 포장 훼손 시 교환 및 환불이 제한될 수 있습니다.',
        '단순 변심에 의한 교환·반품 시 왕복 배송비는 고객 부담입니다.',
        '관계 법령에 따라 소비자에게 인정되는 청약철회 권리는 별도로 적용될 수 있습니다.',
      ],
    },
    {
      title: '서비스 이용 제한',
      paragraphs: [
        '회원이 관계 법령 또는 본 약관을 위반하는 경우 회사는 서비스 이용을 제한할 수 있습니다.',
      ],
    },
    {
      title: '책임의 제한',
      paragraphs: [
        '회사는 천재지변, 시스템 장애, 택배사의 사정 등 불가항력적인 사유로 발생한 손해에 대해서는 책임을 지지 않습니다.',
      ],
    },
    {
      title: '고객센터',
      paragraphs: [],
      table: {
        headers: ['항목', '내용'],
        rows: [
          ['쇼핑몰명', '투투샵(TWOTWOSHOP)'],
          ['고객상담시간', '평일 오전 11시 ~ 오후 7시'],
          ['문의 방법', '사이트 내 1:1 문의'],
        ],
      },
    },
  ],
}

export const PRIVACY_POLICY: LegalDocumentContent = {
  title: '개인정보처리방침',
  sections: [
    {
      title: '개인정보 수집 항목',
      paragraphs: [
        '투투샵(TWOTWOSHOP)은 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.',
      ],
      bullets: [
        '이름',
        '휴대전화번호',
        '이메일 주소',
        '배송지 주소',
        '주문 및 결제 정보',
        '고객 문의 내용',
      ],
    },
    {
      title: '개인정보 이용 목적',
      paragraphs: ['수집한 개인정보는 다음의 목적을 위해 이용됩니다.'],
      bullets: [
        '회원 가입 및 관리',
        '상품 주문 및 배송',
        '고객 상담 및 문의 응대',
        '재입고 알림 서비스 제공',
        '서비스 개선 및 운영',
      ],
    },
    {
      title: '개인정보 보관 기간',
      paragraphs: [
        '회원 탈퇴 시까지 보관합니다.',
        '단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.',
      ],
      table: {
        headers: ['보관 항목', '보관 기간'],
        rows: [
          ['계약 또는 청약철회 기록', '5년'],
          ['대금결제 및 재화 공급 기록', '5년'],
          ['소비자 불만 및 분쟁처리 기록', '3년'],
        ],
      },
    },
    {
      title: '제3자 제공',
      paragraphs: [
        '회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 따른 경우는 예외로 합니다.',
      ],
    },
    {
      title: '처리 위탁',
      paragraphs: [
        '원활한 서비스 제공을 위하여 택배사, 결제 서비스 제공업체 등에 개인정보 처리를 위탁할 수 있습니다.',
      ],
    },
    {
      title: '이용자의 권리',
      paragraphs: [
        '이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제 또는 회원 탈퇴를 요청할 수 있습니다.',
      ],
    },
    {
      title: '개인정보 보호 책임자',
      paragraphs: [],
      table: {
        headers: ['항목', '내용'],
        rows: [
          ['쇼핑몰명', '투투샵(TWOTWOSHOP)'],
          ['고객센터', '사이트 내 1:1 문의'],
          ['운영시간', '평일 오전 11시 ~ 오후 7시'],
        ],
      },
    },
  ],
}
