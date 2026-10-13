// 매장 데이터 편집 파일. 새 가게는 additionalStores에 추가하세요.
// id는 중복 없이 유지하고, 취급 IP는 확인된 경우에만 handledWorksByStore에 등록합니다.
// Store names, areas and street addresses are real, excerpted from the owner's lead list; coordinates come from
// Kakao address search. Which products they hold is made up.
const demoStores = [
  { id: 'ainomono', name: '아이노모노', area: '홍대', location: '서울 마포구 신촌로4길 22-8 1층', lat: 37.557175, lng: 126.927925 },
  { id: 'anisekai', name: '애니세카이 홍대점', area: '홍대', location: '서울 마포구 어울마당로 155-1 2층', lat: 37.556921, lng: 126.927101 },
  { id: 'wechai', name: '웨차이굿즈 홍대점', area: '홍대', location: '서울 마포구 와우산로35길 75 2·3층', lat: 37.556404, lng: 126.926736 },
  { id: 'hongkihabara', name: '홍키하바라', area: '홍대', location: '서울 마포구 홍익로6길 78 2층', lat: 37.557091, lng: 126.925462 },
  { id: 'ddarang', name: '따랑샵', area: '신도림', location: '서울 구로구 새말로 97 신도림테크노마트 B1 324·325호', lat: 37.507117, lng: 126.890223 },
  { id: 'dopamine', name: '도파민굿즈', area: '강동', location: '서울 강동구 양재대로143길 8 2층 201호', lat: 37.551700, lng: 127.143476 },
  { id: 'uraura', name: '스페이스 우라라 강서화곡점 강서화곡점', area: '강서', location: '서울 강서구 화곡로 164 5층 502호', lat: 37.541254, lng: 126.839890 },
  { id: 'mana', name: '마나굿즈', area: '노원 · 상계', location: '서울 노원구 상계로5길 12 동양메이저아파트 상가동 2층 201호', lat: 37.657354, lng: 127.064264 },
  { id: 'figurecenter1', name: '피규어센터 1호점', area: '홍대', location: '서울 마포구 양화로18안길 40 B1', lat: 37.557091, lng: 126.926738 },
  { id: 'kkokko1', name: 'THE꼬꼬굿즈 홍대1호점', area: '홍대', location: '서울 마포구 와우산로27길 68', lat: 37.555471, lng: 126.925139 },
  { id: 'kkuing', name: '꾸잉양판점 홍대', area: '홍대', location: '서울 마포구 와우산로38길 19-1 B1 1호', lat: 37.555340, lng: 126.931897 },
  { id: 'brother', name: '브라더굿즈 홍대', area: '홍대', location: '서울 마포구 신촌로6길 24 2층', lat: 37.556313, lng: 126.929754 },
  { id: 'urara-hongdae', name: '스페이스우라라 홍대입구점', area: '홍대', location: '서울 마포구 와우산로29길 48-29', lat: 37.556258, lng: 126.927727 },
  { id: 'shiro', name: '시로상점', area: '홍대', location: '서울 마포구 와우산로29길 14-12 B1', lat: 37.555317, lng: 126.929202 },
  { id: 'omocha', name: '오모차랜드 홍대점', area: '홍대', location: '서울 마포구 홍익로5길 36 2층', lat: 37.553635, lng: 126.920462 },
  { id: 'onefigure', name: '원피규어 홍대점', area: '홍대', location: '서울 마포구 홍익로6길 14 2층', lat: 37.555150, lng: 126.922860 },
  { id: 'theqoo', name: '더쿠 연트럴파크점', area: '연남', location: '서울 마포구 양화로21길 17 B1', lat: 37.558997, lng: 126.924913 },
  { id: 'cuckoo', name: '쿠쿠스페이스', area: '합정', location: '서울 마포구 잔다리로 45 1층', lat: 37.552121, lng: 126.918597 },
  { id: 'ilovetoys', name: '아이러브토이즈 국전점', area: '서초 · 국전', location: '서울 서초구 효령로 304 국제전자센터 9층 97호', lat: 37.484732, lng: 127.017804 },
  { id: 'kuro', name: '쿠로상점', area: '용산', location: '서울 용산구 한강대로 69 B1 B125-1', lat: 37.527040, lng: 126.964892 },
  { id: 'gacha-gangnam', name: '우주가챠 강남점', area: '강남', location: '서울 강남구 봉은사로2길 13 화성빌딩 지하 1층', lat: 37.503716, lng: 127.025886 },
  { id: 'gacha-kondae', name: '우주가챠 건대점', area: '건대', location: '서울 광진구 아차산로 242 2층', lat: 37.539933, lng: 127.069904 },
  { id: 'comicgallery', name: '코믹갤러리', area: '건대', location: '서울 광진구 아차산로 208', lat: 37.541061, lng: 127.066489 },
  { id: 'toyjjeoreo', name: '토이쩔어스', area: '건대', location: '서울 광진구 아차산로26길 27', lat: 37.540074, lng: 127.065813 },
  { id: 'comiczone', name: '코믹존', area: '신림', location: '서울 관악구 신림로 300 웅산빌딩 B1', lat: 37.481141, lng: 126.930311 },
  { id: 'things', name: '씽스피규어 왕십리역점', area: '왕십리', location: '서울 성동구 왕십리광장로 17 비트플렉스 2층', lat: 37.561442, lng: 127.038394 },
  { id: 'fun-timesquare', name: '펀스퀘어 타임스퀘어점', area: '영등포', location: '서울 영등포구 영중로 15 B1', lat: 37.517233, lng: 126.903716 },
  { id: 'fun-gimpo', name: '펀스퀘어 롯데몰 김포공항점', area: '강서', location: '서울 강서구 하늘길 38 GF', lat: 37.571370, lng: 126.802960 },
  { id: 'animate-jamsil', name: '애니메이트 잠실롯데점', area: '잠실', location: '서울 송파구 올림픽로 240 롯데월드 쇼핑몰 B1', lat: 37.511310, lng: 127.098142 },
  { id: 'lastpick', name: '라스트픽 스토어', area: '성수', location: '서울 성동구 뚝섬로17가길 48 1층 107호', lat: 37.540734, lng: 127.059551 },
  { id: 'cih-kbooks', name: 'CIH SHOP·케이북스', area: '홍대', location: '서울 마포구 양화로 161 B1', lat: 37.556936, lng: 126.923316 },
  { id: 'deokmocle', name: '덕모클', area: '홍대', location: '서울 마포구 양화로18안길 7 B1', lat: 37.556828, lng: 126.925088 },
  { id: 'doonibu-hongdae', name: '두니부 홍대점', area: '홍대', location: '서울 마포구 신촌로4길 14 B1', lat: 37.557388, lng: 126.928319 },
  { id: 'mowazzle-hongdae', name: '모와즐 홍대점', area: '홍대', location: '서울 마포구 양화로18안길 12 B1', lat: 37.556675, lng: 126.925336 },
  { id: 'anseodang', name: '안서당', area: '홍대', location: '서울 마포구 신촌로6길 17 지하', lat: 37.556545, lng: 126.930020 },
  { id: 'aegoodsa', name: '애니굿즈사랑 애굿사', area: '홍대', location: '서울 마포구 와우산로29길 34 B1', lat: 37.555448, lng: 126.928271 },
  { id: 'anicompany-hongdae', name: '애니컴퍼니 홍대점', area: '홍대', location: '서울 마포구 와우산로37길 28 1층 202호', lat: 37.556446, lng: 126.929510 },
  { id: 'aniplaza', name: '애니플라자', area: '홍대', location: '서울 마포구 와우산로29라길 7', lat: 37.555431, lng: 126.927414 },
  { id: 'omocha-hongdae2', name: '오모차랜드 홍대2호점', area: '홍대', location: '서울 마포구 양화로 156 LG팰리스 B2 201호', lat: 37.556113, lng: 126.923447 },
  { id: 'openmy', name: '오픈마이', area: '홍대', location: '서울 마포구 와우산로29길 26-8 2층', lat: 37.555367, lng: 126.928713 },
  { id: 'jsstore-hongdae', name: '제이에스스토어 홍대본점', area: '홍대', location: '서울 마포구 와우산로29길 48-24 1·2층', lat: 37.556307, lng: 126.928086 },
  { id: 'choiae-goods', name: '최애굿즈 홍대점', area: '홍대', location: '서울 마포구 동교동 179-18 / 179-19', lat: 37.557358, lng: 126.929508 },
  { id: 'torimo', name: '토리모상점', area: '홍대', location: '서울 마포구 양화로18안길 20 2층 201호', lat: 37.556753, lng: 126.925697 },
  { id: 'figurecenter2', name: '피규어센터 2호점', area: '홍대', location: '서울 마포구 와우산로29길 39 1층', lat: 37.555415, lng: 126.927756 },
  { id: 'figurecenter3', name: '피규어센터 3호점', area: '홍대', location: '서울 마포구 양화로18안길 26-6 B1', lat: 37.556760, lng: 126.926026 },
  { id: 'figurepresso-fp', name: '피규어프레소 에프피점', area: '홍대', location: '서울 마포구 와우산로29길 48-11', lat: 37.556082, lng: 126.927461 },
  { id: 'hoemarket-hongdae', name: '호에마켓 홍대점', area: '홍대', location: '서울 마포구 와우산로29길 48-14', lat: 37.556002, lng: 126.927810 },
  { id: 'rabbits-goods', name: '토끼굿즈(래빗츠컴퍼니)', area: '망원', location: '서울 마포구 희우정로 112 B1', lat: 37.554913, lng: 126.901043 },
  { id: 'gundambase-ipark', name: '건담베이스 아이파크점', area: '용산', location: '서울 용산구 한강대로23길 55 아이파크몰 리빙파크 6층', lat: 37.529772, lng: 126.964742 },
  { id: 'acornforest-jamsil', name: '도토리숲 잠실 롯데월드몰점', area: '잠실', location: '서울 송파구 올림픽로 300 롯데월드몰 B1', lat: 37.513713, lng: 127.104302 },
  { id: 'aniplus-hapjeong', name: '애니플러스 서울 합정점', area: '합정', location: '서울 마포구 월드컵로3길 14 딜라이트스퀘어 B101–105', lat: 37.551008, lng: 126.911649 },
  { id: 'lashinbang1', name: '라신반 서울 1호점', area: '홍대', location: '서울 마포구 와우산로 100 1층', lat: 37.552847, lng: 126.924728 },
  { id: 'lashinbang-main', name: '라신반 서울 본점', area: '홍대', location: '서울 마포구 양화로 178-5 LC타워 별관 B1', lat: 37.557690, lng: 126.925431 },
  { id: 'megahouse-hongdae', name: '메가하우스 홍대본점', area: '홍대', location: '서울 마포구 양화로 188 AK PLAZA 3층', lat: 37.557746, lng: 126.926498 },
  { id: 'urara-khu', name: '스페이스우라라 경희대점', area: '동대문', location: '서울 동대문구 회기동 45-115 1층', lat: 37.591099, lng: 127.054127 },
  { id: 'deokjideokjil', name: '덕지덕질', area: '광진', location: '서울 광진구 중곡동 640-3 202호', lat: 37.558941, lng: 127.077581 },
  { id: 'kujiwa', name: '쿠지와', area: '은평', location: '서울 은평구 갈현동 399-6 지층', lat: 37.619061, lng: 126.919429 },
  { id: 'gachatsuki', name: '가챠츠키', area: '용산', location: '서울 용산구 남영동 70-1 2층', lat: 37.543087, lng: 126.973351 },
  { id: 'omaro-market', name: '오마로마켓', area: '용산', location: '서울 용산구 한강로2가 420 상가동 지하1층 106-2호 푸르지오써밋', lat: 37.527274, lng: 126.965305 },
  { id: 'hoshigacha', name: '호시가챠', area: '용산', location: '서울 용산구 한강로2가 422 지하2층 제236호', lat: 37.529105, lng: 126.966972 },
  { id: 'gachaocean-yongridan', name: '가챠오션 용리단길점', area: '용산', location: '서울 용산구 한강로1가 214 1층', lat: 37.533226, lng: 126.973725 },
  { id: 'gachayong', name: '가챠용', area: '용산', location: '서울 용산구 갈월동 98-31 103호', lat: 37.541625, lng: 126.971553 },
  { id: 'figure-outlet', name: '피규어아울렛', area: '마포', location: '서울 마포구 서교동 328-26 101호', lat: 37.555727, lng: 126.927771 },
  { id: 'dreamgoods', name: '드림굿즈', area: '은평', location: '서울 은평구 불광동 641 상가동 101-1호', lat: 37.618480, lng: 126.934904 },
  { id: 'gachaocean-hongdae', name: '가챠오션 홍대점', area: '마포', location: '서울 마포구 서교동 347-24 3층', lat: 37.555912, lng: 126.924849 },
  { id: 'kondae-gacha25', name: '건대가챠25', area: '광진', location: '서울 광진구 화양동 5-21 지하1층', lat: 37.542658, lng: 127.071049 },
  { id: 'gachanest', name: '가챠네스트', area: '강동', location: '서울 강동구 천호동 411-41 1층,2층', lat: 37.539605, lng: 127.127769 },
  { id: 'kujifam', name: '쿠지팸', area: '강동', location: '서울 강동구 길동 322-5 201호', lat: 37.544599, lng: 127.144346 },
  { id: 'oneulttogacha', name: '오늘또가챠가챠', area: '성동', location: '서울 성동구 행당동 346 1층 110호, 110-1호', lat: 37.555952, lng: 127.029261 },
  { id: 'gachateum', name: '가챠틈', area: '서대문', location: '서울 서대문구 연희동 192-3 1층', lat: 37.566440, lng: 126.928111 },
  { id: 'kkongsil-hwagok', name: '꽁실가챠샵 화곡점', area: '강서', location: '서울 강서구 화곡동 1065-6 1층 104호', lat: 37.541722, lng: 126.838826 },
  { id: 'brother-hongdae-station', name: '브라더굿즈 홍대입구역점', area: '마포', location: '서울 마포구 동교동 164-30 지하1층', lat: 37.555639, lng: 126.923465 },
  { id: 'davichi-seoulforest', name: '다비츠가챠 서울숲점', area: '성동', location: '서울 성동구 성수동1가 668-100 1층', lat: 37.547606, lng: 127.042732 },
  { id: 'turnstocks', name: '턴스톡스', area: '중랑', location: '서울 중랑구 망우동 182-22 신흥빌딩 2층', lat: 37.602375, lng: 127.108300 },
  { id: 'gachashop-guro', name: '가챠샵', area: '구로', location: '서울 구로구 구로동 197-11 1층108호', lat: 37.486368, lng: 126.892427 },
  { id: 'pikastation-gangnam', name: '피카스테이션 강남', area: '강남', location: '서울 강남구 역삼동 821 강남역 지하도상가 D-22호', lat: 37.498609, lng: 127.027898 },
  { id: 'yumegacha', name: '유메가챠', area: '관악', location: '서울 관악구 신림동 1640-47 2층', lat: 37.483075, lng: 126.929491 },
  { id: 'anipiece', name: '애니피스', area: '서초', location: '서울 서초구 잠원동 35-29 지하 1층, 1층', lat: 37.512164, lng: 127.018891 },
  { id: 'kkongsil-magok', name: '꽁실샵 마곡점', area: '강서', location: '서울 강서구 마곡동 767-4 지하판매및기타동 지2층 비234호', lat: 37.563889, lng: 126.826237 },
  { id: 'jipsa-haru', name: '집사의하루 가챠앤굿즈', area: '노원', location: '서울 노원구 상계동 617 501호', lat: 37.655682, lng: 127.062326 },
  { id: 'gg-comicmarket-hongdae', name: '지지코믹마켓 홍대점', area: '마포', location: '서울 마포구 서교동 332-1 3층 1호', lat: 37.556134, lng: 126.926443 },
  { id: 'kondae-gacha-time', name: '건대가챠샵 타임', area: '광진', location: '서울 광진구 화양동 5-75 1층', lat: 37.541225, lng: 127.070367 },
  { id: 'byeolboreo-gacha', name: '별보러가챠', area: '광진', location: '서울 광진구 화양동 3-37 지하1층', lat: 37.542693, lng: 127.071605 },
  { id: 'anipop', name: '애니팝굿즈샵', area: '강남', location: '서울 강남구 대치동 950-1 5층', lat: 37.506950, lng: 127.062588 },
  { id: 'kujibang', name: '쿠지방', area: '금천', location: '서울 금천구 가산동 345-4 1003호', lat: 37.473376, lng: 126.885448 },
  { id: 'gotchagetcha-songridan', name: '갓챠겟챠 송리단길점', area: '송파', location: '서울 송파구 송파동 42-1 1층 101호', lat: 37.509620, lng: 127.109526 },
  { id: 'brother-gangnam', name: '브라더굿즈 강남', area: '강남', location: '서울 강남구 역삼동 813-13 지하1층', lat: 37.502051, lng: 127.026849 },
  { id: 'cozykuji', name: '코지쿠지', area: '마포', location: '서울 마포구 서교동 329-10 1층', lat: 37.555865, lng: 126.929386 },
  { id: 'gachayang', name: '가챠양', area: '관악', location: '서울 관악구 봉천동 1601-11 1층 2호', lat: 37.479864, lng: 126.954951 },
  { id: 'rainmall', name: '레인몰', area: '마포', location: '서울 마포구 상수동 317-2 2층, 3층', lat: 37.548259, lng: 126.920694 },
  { id: 'ilovetoys-hongdae', name: '아이러브토이즈 홍대점', area: '마포', location: '서울 마포구 서교동 334-15 2층 201호', lat: 37.554557, lng: 126.926816 },
  { id: 'kujinyang', name: '쿠지냥', area: '송파', location: '서울 송파구 잠실동 178-4 4층', lat: 37.510638, lng: 127.080509 },
  { id: 'things-hanyang', name: '씽스피규어 한양대점', area: '성동', location: '서울 성동구 행당동 3-11 지하층', lat: 37.560703, lng: 127.040222 },
  { id: 'hellosumikko', name: '헬로수미코', area: '마포', location: '서울 마포구 서교동 352-21 1층', lat: 37.555004, lng: 126.919210 },
  { id: 'theqoo-hongdae', name: '더쿠 홍대입구점', area: '마포', location: '서울 마포구 동교동 164-17 지하1층', lat: 37.555867, lng: 126.923772 }
];

// Public Naver folder, read on 2026-10-12. Added after demo inventory allocation: no invented stock.
const additionalStores = [
  {
    "id": "naver-001",
    "name": "애니 리퍼마켓 홍대점",
    "location": "서울특별시 마포구 동교동 169-16 3층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 169-16"
  },
  {
    "id": "naver-004",
    "name": "오타쿠지",
    "location": "서울특별시 성북구 동선동2가 58 지하 1층",
    "area": "성북구",
    "searchAddress": "서울특별시 성북구 동선동2가 58"
  },
  {
    "id": "naver-005",
    "name": "이치방쿠지 잠실직영점",
    "location": "서울특별시 송파구 잠실동 40-1 쇼핑몰동 B1층 29호",
    "area": "송파구",
    "searchAddress": "서울특별시 송파구 잠실동 40-1"
  },
  {
    "id": "naver-007",
    "name": "잇쇼니쿠지",
    "location": "서울특별시 구로구 구로동 3-25 B1층 278호279호",
    "area": "구로구",
    "searchAddress": "서울특별시 구로구 구로동 3-25"
  },
  {
    "id": "naver-009",
    "name": "피규어리본 신도림점",
    "location": "서울특별시 구로구 구로동 3-25 2층 제189, 190, 191호",
    "area": "구로구",
    "searchAddress": "서울특별시 구로구 구로동 3-25"
  },
  {
    "id": "naver-018",
    "name": "가샤폰스트리트홍대점",
    "location": "서울특별시 마포구 동교동 192-45",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 192-45"
  },
  {
    "id": "naver-019",
    "name": "토모에 샵",
    "location": "서울특별시 구로구 구로동 3-25 2층 107호",
    "area": "구로구",
    "searchAddress": "서울특별시 구로구 구로동 3-25"
  },
  {
    "id": "naver-020",
    "name": "코끼리밥캡슐토이",
    "location": "서울특별시 마포구 동교동 159-5 EXIT 지하1층 코끼리밥 캡슐토이",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 159-5"
  },
  {
    "id": "naver-021",
    "name": "시로가챠",
    "location": "서울특별시 마포구 서교동 328-7 2층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 서교동 328-7"
  },
  {
    "id": "naver-022",
    "name": "라스트원 홍대",
    "location": "서울특별시 마포구 서교동 334-4 2층 라스트원 홍대",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 서교동 334-4"
  },
  {
    "id": "naver-023",
    "name": "캑티 가챠샵 홍대점",
    "location": "서울특별시 마포구 서교동 407-22",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 서교동 407-22"
  },
  {
    "id": "naver-026",
    "name": "캑티 가챠샵 발산점",
    "location": "서울특별시 강서구 마곡동 795-7 1층",
    "area": "강서구",
    "searchAddress": "서울특별시 강서구 마곡동 795-7"
  },
  {
    "id": "naver-027",
    "name": "최애 피규어",
    "location": "서울특별시 마포구 동교동 179-19 지하 1층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 179-19"
  },
  {
    "id": "naver-033",
    "name": "국제전자센터",
    "location": "서울특별시 서초구 서초동 1445-3",
    "area": "서초구",
    "searchAddress": "서울특별시 서초구 서초동 1445-3"
  },
  {
    "id": "naver-038",
    "name": "쿄우마가챠샵 LC타워점",
    "location": "서울특별시 마포구 동교동 167-2",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 167-2"
  },
  {
    "id": "naver-040",
    "name": "겟챠 서울 강남점",
    "location": "서울특별시 강남구 역삼동 815-7",
    "area": "강남구",
    "searchAddress": "서울특별시 강남구 역삼동 815-7"
  },
  {
    "id": "naver-050",
    "name": "대원샵 아이파크몰 용산점",
    "location": "서울특별시 용산구 한강로3가 40-999 아이파크몰 리빙파크 3F 도파민스테이션",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-051",
    "name": "팝마트 코엑스점",
    "location": "서울특별시 강남구 삼성동 159 코엑스몰 B1층 메가박스 코엑스점 내",
    "area": "강남구",
    "searchAddress": "서울특별시 강남구 삼성동 159"
  },
  {
    "id": "naver-052",
    "name": "제일복권 AK&홍대 공식 판매점",
    "location": "서울특별시 마포구 동교동 190-1 AK&홍대 5층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 190-1"
  },
  {
    "id": "naver-055",
    "name": "오타쿠만물상",
    "location": "서울특별시 마포구 서교동 337-1 2층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 서교동 337-1"
  },
  {
    "id": "naver-057",
    "name": "롯데마트 토이저러스 은평점",
    "location": "서울특별시 은평구 진관동 63 롯데몰 은평점 2층 토이저러스 은평점",
    "area": "은평구",
    "searchAddress": "서울특별시 은평구 진관동 63"
  },
  {
    "id": "naver-058",
    "name": "피규어뮤지엄w",
    "location": "서울특별시 강남구 청담동 84-9 Ys Roo",
    "area": "강남구",
    "searchAddress": "서울특별시 강남구 청담동 84-9"
  },
  {
    "id": "naver-062",
    "name": "애니메이트 카페 잠실롯데점",
    "location": "서울특별시 송파구 잠실동 40-1 쇼핑몰동 B1층 29호",
    "area": "송파구",
    "searchAddress": "서울특별시 송파구 잠실동 40-1"
  },
  {
    "id": "naver-063",
    "name": "게임너츠",
    "location": "서울특별시 동작구 신대방동 395-68 보라매나산스위트 B1 게임너츠",
    "area": "동작구",
    "searchAddress": "서울특별시 동작구 신대방동 395-68"
  },
  {
    "id": "naver-064",
    "name": "포켓몬카드숍 아이파크몰점",
    "location": "서울특별시 용산구 한강로3가 40-999 용산역 아이파크몰 8층",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-066",
    "name": "가챠파크아이파크몰용산점리빙파크점",
    "location": "서울특별시 용산구 한강로3가 40-999 용산역",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-067",
    "name": "도토리숲 용산 아이파크몰점",
    "location": "서울특별시 용산구 한강로3가 40-999 아이파크몰 리빙파크 6층 팝콘D스퀘어",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-068",
    "name": "마블컬렉션 용산점",
    "location": "서울특별시 용산구 한강로3가 40-999",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-069",
    "name": "팝마트 아이파크몰 용산점",
    "location": "서울특별시 용산구 한강로3가 40-999 용산아이파크몰 리빙파크 6층",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-070",
    "name": "타미야 플라모델 팩토리 용산점",
    "location": "서울특별시 용산구 한강로3가 40-999 아이파트몰리빙파크 6층",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-071",
    "name": "반다이남코 코리아스토어",
    "location": "서울특별시 용산구 한강로3가 40-999 HDC아이파크몰 리빙파크 6층",
    "area": "용산구",
    "searchAddress": "서울특별시 용산구 한강로3가 40-999"
  },
  {
    "id": "naver-075",
    "name": "롯데마트 제타플렉스 서울역점",
    "location": "서울특별시 중구 봉래동2가 122-11",
    "area": "중구",
    "searchAddress": "서울특별시 중구 봉래동2가 122-11"
  },
  {
    "id": "naver-077",
    "name": "뽈랄라백화점",
    "location": "서울특별시 마포구 서교동 335-4 지하 102호",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 서교동 335-4"
  },
  {
    "id": "naver-078",
    "name": "더꼬꼬굿즈",
    "location": "서울특별시 마포구 서교동 347-17 3층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 서교동 347-17"
  },
  {
    "id": "naver-080",
    "name": "캡슐샵안서당 3호점",
    "location": "서울특별시 마포구 동교동 177-11",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 177-11"
  },
  {
    "id": "naver-087",
    "name": "장난감가게",
    "location": "서울특별시 종로구 창신동 330-32",
    "area": "종로구",
    "searchAddress": "서울특별시 종로구 창신동 330-32"
  },
  {
    "id": "naver-088",
    "name": "승진완구",
    "location": "서울특별시 종로구 창신동 390-3",
    "area": "종로구",
    "searchAddress": "서울특별시 종로구 창신동 390-3"
  },
  {
    "id": "naver-101",
    "name": "피규어프렌즈",
    "location": "서울특별시 마포구 동교동 169-15 지층",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 169-15"
  },
  {
    "id": "naver-102",
    "name": "테크노마트",
    "location": "서울특별시 구로구 구로동 3-25",
    "area": "구로구",
    "searchAddress": "서울특별시 구로구 구로동 3-25"
  },
  {
    "id": "naver-104",
    "name": "AK PLAZA 홍대",
    "location": "서울특별시 마포구 동교동 190-1",
    "area": "마포구",
    "searchAddress": "서울특별시 마포구 동교동 190-1"
  }
];
// Register confirmed IPs by store ID. No assignment means unverified.
// Example shape: { storeId: ['보컬로이드'] }; do not infer these from demo inventory.
const handledWorksByStore = {};

// 주력 상품 태그 후보. 새 태그를 추가할 수 있으며 실제 등록된 태그도 필터에 자동 포함됩니다.
const storeTagOptions = ['피규어', '가챠', '쿠지', '인형', '트레이딩 카드', '캐릭터 굿즈'];
// 확인된 가게의 주력 상품만 등록하세요. 미등록은 미확인이며 재고를 뜻하지 않습니다.
// 예: { '매장ID': ['피규어', '쿠지'] }
const focusTagsByStore = {};
