import { RECORD_TITLE_CANDIDATE_SECTIONS } from '../src/screens/recordTitleCandidates';

describe('RECORD_TITLE_CANDIDATE_SECTIONS', () => {
  test('3つのセクションが存在する', () => {
    expect(RECORD_TITLE_CANDIDATE_SECTIONS).toHaveLength(3);
  });

  test('各セクションに name と data がある', () => {
    for (const section of RECORD_TITLE_CANDIDATE_SECTIONS) {
      expect(typeof section.name).toBe('string');
      expect(section.name.length).toBeGreaterThan(0);
      expect(Array.isArray(section.data)).toBe(true);
      expect(section.data.length).toBeGreaterThan(0);
    }
  });

  test('セクション名が「身体の成長」「治療・検診」「気づき・はじめて」である', () => {
    const names = RECORD_TITLE_CANDIDATE_SECTIONS.map((s) => s.name);
    expect(names).toEqual(['身体の成長', '治療・検診', '気づき・はじめて']);
  });

  test('各セクションの項目が重複していない', () => {
    for (const section of RECORD_TITLE_CANDIDATE_SECTIONS) {
      const unique = new Set(section.data);
      expect(unique.size).toBe(section.data.length);
    }
  });

  test('治療・検診セクションに新規5項目が含まれている', () => {
    const section = RECORD_TITLE_CANDIDATE_SECTIONS.find((s) => s.name === '治療・検診')!;
    expect(section.data).toContain('経口哺乳開始');
    expect(section.data).toContain('輸血をした');
    expect(section.data).toContain('未熟児網膜症の治療');
    expect(section.data).toContain('聴覚検査を受けた');
    expect(section.data).toContain('頭部MRIを受けた');
  });

  test('気づき・はじめてセクションに発達マイルストーンと初めて記念日が含まれている', () => {
    const section = RECORD_TITLE_CANDIDATE_SECTIONS.find((s) => s.name === '気づき・はじめて')!;
    // 初めて記念日
    expect(section.data).toContain('初めて赤ちゃんに会った日');
    expect(section.data).toContain('初めて赤ちゃんを抱っこした日');
    // 発達マイルストーン
    expect(section.data).toContain('首がすわった');
    expect(section.data).toContain('ひとりで歩いた');
    expect(section.data).toContain('二語文を話した');
    expect(section.data).toContain('自分の名前が言えた');
  });

  test('「初めて〇〇できた」が含まれていない', () => {
    const allItems = RECORD_TITLE_CANDIDATE_SECTIONS.flatMap((s) => s.data);
    expect(allItems).not.toContain('初めて〇〇できた');
  });
});
