sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ServiceNames
  ) => {
    'use strict';

    class MenuModel extends JSONModel {
      constructor(oUIComponent) {
        super();

        this.oUIComponent = oUIComponent;

        this.promise = this.retrieve();
      }

      retrieve() {
        return new Promise((resolve) => {
          const sUrl = '/GetMenuLvSet';
          this.oUIComponent.getModel(ServiceNames.COMMON).create(
            sUrl,
            {
              Device: '',
              GetMenuLv1Nav: [],
              GetMenuLv2Nav: [],
              GetMenuLv3Nav: [],
              GetMenuLv4Nav: [],
            },
            {
              success: (oData, oResponse) => {
                AppUtils.debug(`${sUrl} success.`, oData, oResponse);

                this.setData(this.transform(oData));

                resolve();
              },
              error: (oError) => {
                AppUtils.debug(`${sUrl} error.`, oError);

                this.setData(this.transform(oData));

                resolve();
              },
            }
          );
        });
      }

      /**
       * 메뉴 tree 정보 생성
       * @param {map} GetMenuLv1Nav 1 level 메뉴 정보
       * @param {map} GetMenuLv2Nav 2 level 메뉴 정보
       * @param {map} GetMenuLv3Nav 3 level 메뉴 정보
       * @param {map} GetMenuLv4Nav 메뉴 속성 정보
       * @returns {array} 메뉴 tree 정보
       */
      transform({ GetMenuLv1Nav = {}, GetMenuLv2Nav = {}, GetMenuLv3Nav = {}, GetMenuLv4Nav = {} }) {
        const { results: aLevel1 = [] } = GetMenuLv1Nav;
        const { results: aLevel2 = [] } = GetMenuLv2Nav;
        const { results: aLevel3 = [] } = GetMenuLv3Nav;
        const { results: aLevel4 = [] } = GetMenuLv4Nav;

        const mLevel1Sub = {};
        const mLevel2Sub = {};

        const mUrlToMenid = {}; // mUrlToMenid[URL] -> Menid
        const mMenidToProperties = {}; // mMenidToProperties[Menid] -> Menu
        const aFavoriteMenids = [];

        // 샘플 메뉴 추가
        this.appendSampleMenu({ aLevel1, aLevel2, aLevel3, aLevel4 });

        // 각 메뉴 속성 정리
        aLevel4.map(({ Mnurl, Menid, Phead }) => {
          mUrlToMenid[Mnurl] = Menid;
          mMenidToProperties[Menid] = { Menid, Mnurl, Phead };
        });

        // 3rd level 메뉴 속성 정리
        aLevel3.map((m) => {
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            aFavoriteMenids.push(m.Menid);
          }

          const mMenuProperties = mMenidToProperties[m.Menid] || {};
          mMenuProperties.Mnid1 = m.Mnid1;
          mMenuProperties.Mnid2 = m.Mnid2;
          mMenuProperties.Mnid3 = m.Mnid3;
          mMenuProperties.Mname = m.Mnnm3;
          mMenuProperties.Mepop = m.Mepop === 'X';
          mMenuProperties.Favor = m.Favor === 'X';
          mMenuProperties.Pwchk = m.Pwchk === 'X';

          const aLevel2SubMenu = mLevel2Sub[m.Mnid2];
          if (aLevel2SubMenu) {
            aLevel2SubMenu.push(mMenuProperties);
          } else {
            mLevel2Sub[m.Mnid2] = [mMenuProperties];
          }
        });

        // 2nd level 메뉴 속성 정리
        aLevel2.map((m) => {
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            aFavoriteMenids.push(m.Menid);
          }

          const mMenuProperties = {
            Menid: m.Menid,
            Mnid2: m.Mnid2,
            Mname: m.Mnnm2,
            Mnurl: !m.Menid ? '' : (mMenidToProperties[m.Menid] || {}).Mnurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
            Children: mLevel2Sub[m.Mnid2] || [],
          };
          const aLevel1SubMenu = mLevel1Sub[m.Mnid1];
          if (aLevel1SubMenu) {
            aLevel1SubMenu.push(mMenuProperties);
          } else {
            mLevel1Sub[m.Mnid1] = [mMenuProperties];
          }
        });

        // Top level 메뉴 속성 정리
        const tree = aLevel1.map((m) => {
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            aFavoriteMenids.push(m.Menid);
          }
          return {
            Menid: m.Menid,
            Mnid1: m.Mnid1,
            Mname: m.Mnnm1,
            Mnurl: !m.Menid ? '' : (mMenidToProperties[m.Menid] || {}).Mnurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
            Children: mLevel1Sub[m.Mnid1] || [],
            StyleClasses: m.Mnid1 === '70000' ? 'menu-mss' : m.Mnid1 === '80000' ? 'menu-hass' : '',
          };
        });

        return {
          tree,
          menidToProperties: mMenidToProperties,
          urlToMenid: mUrlToMenid,
          favoriteMenids: aFavoriteMenids,
        };
      }

      appendSampleMenu({ aLevel1, aLevel2, aLevel3, aLevel4 }) {
        // 샘플 메뉴 정보 추가
        if (!AppUtils.isLOCAL() && !AppUtils.isDEV()) {
          return;
        }

        aLevel4.splice(
          ...[
            aLevel4.length,
            0,
            {
              Pinfo: '',
              Menid: 'X110',
              Mnurl: 'sampleComponents',
              Mentx: '퍼블용 컴포넌트',
            },
            {
              Pinfo: '',
              Menid: 'X120',
              Mnurl: 'sampleTimeline',
              Mentx: 'Timeline sample',
            },
            {
              Pinfo: '',
              Menid: 'X130',
              Mnurl: 'sampleNinebox',
              Mentx: '9 Box Model',
            },
            {
              Pinfo: '',
              Menid: 'X140',
              Mnurl: 'sampleDonutChart',
              Mentx: 'Donut Chart',
            },
            {
              Pinfo: '',
              Menid: 'X210',
              Mnurl: 'https://www.google.co.kr',
              Mentx: '구글',
            },
          ]
        );

        aLevel3.splice(
          ...[
            aLevel3.length,
            0,
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X110',
              Mnnm3: '퍼블용 컴포넌트',
              Mnsrt: '001',
              Menid: 'X110',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: 'X',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X120',
              Mnnm3: 'Timeline',
              Mnsrt: '002',
              Menid: 'X120',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X130',
              Mnnm3: '9 Box Model',
              Mnsrt: '003',
              Menid: 'X130',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X140',
              Mnnm3: 'Donut Chart',
              Mnsrt: '004',
              Menid: 'X140',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X2000',
              Mnid3: 'X210',
              Mnnm3: '구글',
              Mnsrt: '001',
              Menid: 'X210',
              Mepop: 'X',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
          ]
        );

        aLevel2.splice(
          ...[
            aLevel2.length,
            0,
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnnm2: '샘플 1',
              Mnsrt: '001',
              Menid: 'X100',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X2000',
              Mnnm2: '샘플 2',
              Mnsrt: '002',
              Menid: 'X200',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
          ]
        );

        aLevel1.splice(
          ...[
            aLevel1.length,
            0,
            {
              Mnid1: 'X0000',
              Mnnm1: 'Samples',
              Mnsrt: '999',
              Menid: 'X000',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
            },
          ]
        );
      }

      getPromise() {
        return this.promise;
      }

      getTree() {
        return this.getProperty('/tree');
      }

      getProperties(sMenid) {
        return this.getProperty(`/menidToProperties/${sMenid}`);
      }

      getMenid(sUrl) {
        if (!sUrl) {
          return this.getProperty(`/Current/Menid`);
        }
        return this.getProperty(`/urlToMenid/${sUrl}`);
      }

      getFavoriteMenids() {
        return this.getProperty('/favoriteMenids');
      }
    }

    return MenuModel;
  }
);
