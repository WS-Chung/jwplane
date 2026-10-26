/*
  비행기 데이터
  - people: 탈 수 있는 사람 수 (전투기는 조종사 수, 여객기는 손님 좌석 수 대략)
  - speed : 빠르기 (시속 km, 전투기는 최고 속도, 여객기는 보통 날아가는 속도)
  - length/height : 길이·높이 (m) → 크기 비교 화면에서 실제 비율로 그릴 때 사용
  - 숫자는 아이 눈높이용 어림값이에요. 정확한 제원과 조금 다를 수 있어요.
*/
window.PLANES = {
  // ───────── 하늘을 지키는 비행기 (전투기) ─────────
  kf21: {
    name: "KF-21 보라매", country: ["kr"], airline: "대한민국 공군", people: 1, speed: 2200, length: 16.9, height: 4.7,
    nick: "‘보라매’는 씩씩한 어린 매라는 뜻",
    feature: "우리나라가 직접 만든 최신 비행기예요. 우리 하늘을 든든하게 지켜요.",
  },
  t50b: {
    name: "T-50B 블랙이글스", country: ["kr"], airline: "대한민국 공군", people: 2, speed: 1800, length: 13.1, height: 4.9,
    nick: "‘블랙이글스’는 검은 독수리들", tag: "곡예비행팀",
    feature: "우리나라 곡예비행팀이에요. 하늘에 하얀 연기로 하트와 태극 무늬를 그려요.",
  },
  f15k: {
    name: "F-15K 슬램이글", country: ["us"], airline: "대한민국 공군", people: 2, speed: 2650, length: 19.4, height: 5.6,
    nick: "‘이글’은 독수리라는 뜻",
    feature: "크고 힘이 세서 아주 멀리까지 날아가요. 우리 공군의 큰형님 비행기예요.",
  },
  f35a: {
    name: "F-35A 라이트닝 II", country: ["us"], people: 1, speed: 1930, length: 15.7, height: 4.4,
    nick: "‘라이트닝’은 번개라는 뜻",
    feature: "레이더에 잘 안 보이는 숨바꼭질 대장이에요. 우리 공군도 타요.",
  },
  f16: {
    name: "F-16 파이팅 팰컨", country: ["us"], people: 1, speed: 2120, length: 15.1, height: 5.1,
    nick: "‘팰컨’은 매라는 뜻",
    feature: "작고 날쌘 비행기예요. 세계 여러 나라에서 아주 많이 타요. 우리 공군도 타요.",
  },
  f22: {
    name: "F-22 랩터", country: ["us"], people: 1, speed: 2410, length: 18.9, height: 5.1,
    nick: "‘랩터’는 사냥하는 큰 새라는 뜻",
    feature: "엔진 꼬리가 위아래로 움직여요. 그래서 하늘에서 빙글빙글 재주를 잘 넘어요.",
  },
  fa18: {
    name: "F/A-18 호넷", country: ["us"], airline: "미국 해군 블루엔젤스", people: 1, speed: 1900, length: 17.1, height: 4.7,
    nick: "‘호넷’은 말벌, ‘블루엔젤스’는 파란 천사들", tag: "곡예비행팀",
    feature: "파란색과 노란색 옷을 입은 미국 해군 곡예비행팀이에요. 바다 위 커다란 배에서도 뜨고 내려요.",
  },
  f14: {
    name: "F-14 톰캣", country: ["us"], people: 2, speed: 2485, length: 19.1, height: 4.9,
    nick: "‘톰캣’은 수컷 고양이라는 뜻",
    feature: "날개를 접었다 폈다 할 수 있어요! 빨리 날 때는 날개를 뒤로 쏙 접어요.",
  },
  f4: {
    name: "F-4 팬텀 II", country: ["us"], people: 2, speed: 2370, length: 19.2, height: 5.0,
    nick: "‘팬텀’은 유령이라는 뜻", tag: "할아버지 비행기",
    feature: "우리나라 하늘을 50년 넘게 지키다가 2024년에 은퇴한 할아버지 비행기예요.",
  },
  sr71: {
    name: "SR-71 블랙버드", country: ["us"], people: 2, speed: 3540, length: 32.7, height: 5.6,
    nick: "‘블랙버드’는 검은 새라는 뜻", tag: "가장 빠른 비행기",
    feature: "세상에서 가장 빠른 제트 비행기예요! 아주 높이 날면서 멀리 살펴봤어요. 지금은 박물관에서 쉬어요.",
  },
  typhoon: {
    name: "유로파이터 타이푼", country: ["gb", "de", "it", "es"], people: 1, speed: 2495, length: 16.0, height: 5.3,
    nick: "‘타이푼’은 태풍이라는 뜻", countryText: "유럽 네 나라",
    feature: "영국, 독일, 이탈리아, 스페인 네 나라가 힘을 모아 만들었어요.",
  },
  rafale: {
    name: "라팔", country: ["fr"], people: 1, speed: 1900, length: 15.3, height: 5.3,
    nick: "‘라팔’은 휙 부는 세찬 바람",
    feature: "땅에서도, 바다 위 커다란 배에서도 뜨고 내릴 수 있는 재주꾼이에요.",
  },
  gripen: {
    name: "그리펜", country: ["se"], people: 2, speed: 2200, length: 15.2, height: 4.5,
    nick: "사자 몸에 독수리 날개를 가진 상상 속 동물",
    feature: "짧은 길에서도 뜨고 내릴 수 있어요. 작지만 아주 똑똑한 비행기예요.",
  },
  su27: {
    name: "Su-27 플랭커", country: ["ru"], airline: "러시안 나이츠", people: 1, speed: 2500, length: 21.9, height: 5.9,
    nick: "‘러시안 나이츠’는 러시아의 기사들", tag: "곡예비행팀",
    feature: "코브라처럼 고개를 번쩍 드는 ‘코브라 묘기’로 유명해요. 이 비행기는 러시아 곡예비행팀이에요.",
  },
  mig29: {
    name: "MiG-29 펄크럼", country: ["ru"], airline: "스트리쥐 곡예비행팀", people: 1, speed: 2400, length: 17.3, height: 4.7,
    nick: "‘스트리쥐’는 러시아 말로 제비들", tag: "곡예비행팀",
    feature: "땅에서는 엔진 입구 문을 닫아서 돌멩이가 안 들어가게 해요. 똑똑하죠?",
  },
  j20: {
    name: "J-20 위룽", country: ["cn"], people: 1, speed: 2100, length: 20.4, height: 4.5,
    nick: "‘위룽’은 힘센 용이라는 뜻",
    feature: "코 옆에 작은 날개가 하나 더 붙어 있어요. 중국에서 만들었어요.",
  },
  f2: {
    name: "F-2", country: ["jp"], people: 2, speed: 2120, length: 15.5, height: 5.0,
    nick: "바다색 옷을 입은 비행기",
    feature: "바다 위를 날 때 잘 안 보이도록 파란 옷을 입었어요. 일본에서 만들었어요.",
  },
  harrier: {
    name: "해리어", country: ["gb", "us"], airline: "미국 해병대", people: 1, speed: 1080, length: 14.1, height: 3.6,
    nick: "‘해리어’는 매를 닮은 새 이름", countryText: "영국과 미국",
    feature: "헬리콥터처럼 제자리에서 둥실 떠오르고, 하늘에 가만히 멈춰 있을 수도 있어요!",
  },
  spitfire: {
    name: "스핏파이어", country: ["gb"], people: 1, speed: 650, length: 9.1, height: 3.9,
    nick: "‘스핏파이어’는 씩씩하고 화끈한 친구", tag: "옛날 비행기",
    feature: "프로펠러로 나는 80살 넘은 옛날 비행기예요. 동그란 날개 모양이 예뻐요.",
  },
  p51: {
    name: "P-51 머스탱", country: ["us"], people: 1, speed: 700, length: 9.8, height: 4.1,
    nick: "‘머스탱’은 들판을 달리는 야생마", tag: "옛날 비행기",
    feature: "프로펠러가 빙글빙글! 지금은 에어쇼에서 멋지게 날아요. 이 비행기 이름은 ‘돌리’예요.",
  },

  // ───────── 사람을 태우는 비행기 (여객기) ─────────
  a380: {
    name: "에어버스 A380", country: ["eu"], countryText: "유럽 여러 나라", airline: "대한항공",
    people: 407, speed: 900, length: 72.7, height: 24.1,
    nick: "하늘을 나는 2층 버스", tag: "세상에서 가장 큰 여객기",
    feature: "세상에서 가장 큰 여객기예요! 비행기 안이 1층과 2층으로 나뉘어 있어요.",
  },
  b747: {
    name: "보잉 747", country: ["us"], airline: "대한항공", people: 404, speed: 910, length: 70.7, height: 19.4,
    nick: "‘하늘의 여왕’이라는 별명",
    feature: "머리 위에 혹이 볼록! 그 안에도 의자가 있어요. 엔진이 4개예요.",
  },
  b777: {
    name: "보잉 777", country: ["us"], airline: "대한항공", people: 300, speed: 905, length: 73.9, height: 18.5,
    nick: "엔진이 아주 큰 힘센 비행기",
    feature: "엔진 입구가 작은 비행기 몸통만큼 커요! 엔진 두 개로 먼 나라까지 날아가요.",
  },
  b787: {
    name: "보잉 787 드림라이너", country: ["us"], airline: "대한항공", people: 269, speed: 900, length: 62.8, height: 17.0,
    nick: "‘드림라이너’는 꿈의 비행기",
    feature: "날 때 날개가 새처럼 위로 휘어져요. 창문이 크고, 버튼으로 창문 색이 바뀌어요.",
  },
  a350: {
    name: "에어버스 A350", country: ["eu"], countryText: "유럽 여러 나라", airline: "아시아나항공",
    people: 311, speed: 900, length: 66.8, height: 17.1,
    nick: "날개 끝이 쏙 올라간 비행기",
    feature: "날개 끝이 새 날개처럼 위로 휘어 있어요. 가벼워서 연료를 아껴요.",
  },
  a330: {
    name: "에어버스 A330", country: ["eu"], countryText: "유럽 여러 나라", airline: "대한항공",
    people: 276, speed: 870, length: 63.7, height: 16.8,
    nick: "먼 나라도 거뜬한 튼튼이",
    feature: "엔진 두 개로 바다를 건너 먼 나라까지 날아가요.",
  },
  a340: {
    name: "에어버스 A340", country: ["eu"], countryText: "유럽 여러 나라", airline: "버진 애틀랜틱",
    people: 310, speed: 880, length: 75.4, height: 17.2,
    nick: "엔진이 네 개인 길쭉이",
    feature: "엔진이 4개! 몸이 아주 길어서 A380보다도 길어요.",
  },
  b767: {
    name: "보잉 767", country: ["us"], airline: "아시아나항공", people: 250, speed: 850, length: 54.9, height: 15.9,
    nick: "통로가 두 개인 비행기",
    feature: "비행기 안에 걸어 다니는 길이 두 줄이에요. 오랫동안 우리나라 하늘을 날았어요.",
  },
  b737: {
    name: "보잉 737", country: ["us"], airline: "제주항공", people: 189, speed: 840, length: 39.5, height: 12.5,
    nick: "제주도 가는 비행기",
    feature: "제주도 갈 때 많이 타요! 세상에서 가장 많이 만들어진 여객기 가족이에요.",
  },
  a321: {
    name: "에어버스 A321neo", country: ["eu"], countryText: "유럽 여러 나라", airline: "아시아나항공",
    people: 188, speed: 840, length: 44.5, height: 11.8,
    nick: "‘neo’는 새롭다는 뜻",
    feature: "가까운 나라에 갈 때 타요. 연료를 아끼고 소리가 조용해요.",
  },
  a220: {
    name: "에어버스 A220", country: ["ca", "eu"], countryText: "캐나다와 유럽", airline: "대한항공",
    people: 140, speed: 830, length: 38.7, height: 11.5,
    nick: "조용조용 꼬마 여객기",
    feature: "캐나다에서 태어나서 에어버스 가족이 되었어요. 창문이 커서 바깥 구경하기 좋아요.",
  },
  e195: {
    name: "엠브라에르 E195-E2", country: ["br"], people: 132, speed: 830, length: 41.5, height: 10.9,
    nick: "얼굴에 그림을 그린 비행기",
    feature: "브라질에서 만들었어요. 까만 옷을 입고, 코에 멋진 동물 얼굴 그림을 그렸어요.",
  },
  atr72: {
    name: "ATR 72", country: ["fr", "it"], countryText: "프랑스와 이탈리아", airline: "에어 노스트룸",
    people: 70, speed: 510, length: 27.2, height: 7.7,
    nick: "날개에 프로펠러 두 개",
    feature: "프로펠러를 빙글빙글 돌려서 날아요. 가까운 섬이나 도시를 오가요.",
  },
  q400: {
    name: "대시 8 Q400", country: ["ca"], airline: "오스트리아항공", people: 78, speed: 667, length: 32.8, height: 8.3,
    nick: "빠른 프로펠러 비행기",
    feature: "프로펠러 비행기 중에서 아주 빠른 편이에요. 날개가 몸통 위에 붙어 있어요.",
  },
  concorde: {
    name: "콩코드", country: ["gb", "fr"], countryText: "영국과 프랑스", airline: "영국항공",
    people: 100, speed: 2180, length: 61.7, height: 12.2,
    nick: "‘콩코드’는 사이좋게 함께라는 뜻", tag: "소리보다 빠른 여객기",
    feature: "소리보다 2배나 빨랐던 여객기예요! 뾰족한 코가 착륙할 때 아래로 꺾여요. 지금은 박물관에서 쉬어요.",
  },
  dc3: {
    name: "더글러스 DC-3", country: ["us"], people: 28, speed: 333, length: 19.7, height: 5.2,
    nick: "90살 할아버지 여객기", tag: "옛날 비행기",
    feature: "1935년에 처음 날았어요. 땅에서는 꼬리를 바닥에 대고 앉아 있어요.",
  },
  md11: {
    name: "MD-11", country: ["us"], airline: "상하이항공 화물기", people: 293, speed: 880, length: 61.6, height: 17.6,
    nick: "엔진이 세 개인 비행기",
    feature: "엔진이 3개! 양쪽 날개에 하나씩, 그리고 꼬리에 하나가 더 있어요.",
  },
  c919: {
    name: "코맥 C919", country: ["cn"], airline: "중국동방항공", people: 158, speed: 830, length: 38.9, height: 12.0,
    nick: "중국에서 태어난 여객기",
    feature: "중국이 직접 만든 여객기예요. 2023년부터 손님을 태우기 시작했어요.",
  },
  beluga: {
    name: "에어버스 벨루가 XL", country: ["eu"], countryText: "유럽 여러 나라", cargo: true,
    people: 2, speed: 737, length: 63.1, height: 18.9,
    nick: "웃는 흰고래를 닮은 비행기", tag: "짐 나르는 비행기",
    feature: "고래 얼굴을 닮았죠? 사람 대신 비행기 날개처럼 아주 큰 짐을 실어 날라요.",
  },
  lcf: {
    name: "보잉 747 드림리프터", country: ["us"], cargo: true, people: 2, speed: 878, length: 71.7, height: 21.5,
    nick: "등이 불룩한 비행기", tag: "짐 나르는 비행기",
    feature: "787 비행기의 날개와 몸통을 실어 날라요. 꼬리 쪽이 통째로 옆으로 열려요!",
  },

  // ───────── 크기 비교에만 나오는 비행기 ─────────
  c172: {
    name: "세스나 172", country: ["us"], people: 4, speed: 226, length: 8.3, height: 2.7,
    nick: "작은 프로펠러 비행기",
    feature: "비행기 조종을 처음 배울 때 많이 타는 작은 비행기예요.",
  },
  kt1: {
    name: "KT-1 웅비", country: ["kr"], people: 2, speed: 648, length: 10.3, height: 3.7,
    nick: "‘웅비’는 힘차게 날아오른다는 뜻",
    feature: "공군 조종사가 처음 비행을 배우는 우리나라 프로펠러 비행기예요.",
  },
};

window.FIGHTERS = ["kf21", "t50b", "f15k", "f35a", "f16", "f22", "fa18", "f14", "f4", "sr71",
  "typhoon", "rafale", "gripen", "su27", "mig29", "j20", "f2", "harrier", "spitfire", "p51"];

window.AIRLINERS = ["a380", "b747", "b777", "b787", "a350", "a330", "a340", "b767", "b737", "a321",
  "a220", "e195", "atr72", "q400", "concorde", "dc3", "md11", "c919", "beluga", "lcf"];

// 작은 비행기 → 큰 비행기 순서. 마지막은 꼭 A380!
// (777, A340, 747-8처럼 A380보다 긴 비행기는 마지막 하이라이트를 위해 뺐어요)
window.SIZE_ORDER = ["c172", "kt1", "t50b", "f16", "kf21", "f15k", "atr72", "q400", "b737", "a321",
  "b767", "concorde", "b787", "a350", "b747", "a380"];
