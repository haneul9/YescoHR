sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/model/base/UIComponentBaseModel',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    UIComponentBaseModel
  ) => {
    'use strict';

    return UIComponentBaseModel.extend('sap.ui.yesco.mvc.model.MenuModel', {
      async retrieve() {
        try {
          const oModel = this.getUIComponent().getModel(ServiceNames.COMMON);
          const sUrl = 'GetMenuLv';
          const mPayload = {
            Device: '',
            GetMenuLv1Nav: [],
            GetMenuLv2Nav: [],
            GetMenuLv3Nav: [],
            GetMenuLv4Nav: [],
          };

          const oData = await Client.deep(oModel, sUrl, mPayload);

          this.setData(this.curryData(oData));

          return Promise.resolve();
        } catch (oError) {
          return Promise.reject(oError);
        }
      },

      /**
       * 메뉴 tree 정보 생성
       * @param {map} GetMenuLv1Nav 1 level 메뉴 정보
       * @param {map} GetMenuLv2Nav 2 level 메뉴 정보
       * @param {map} GetMenuLv3Nav 3 level 메뉴 정보
       * @param {map} GetMenuLv4Nav 메뉴 속성 정보
       * @returns {array} 메뉴 tree 정보
       */
      curryData({ GetMenuLv1Nav = {}, GetMenuLv2Nav = {}, GetMenuLv3Nav = {}, GetMenuLv4Nav = {} }) {
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
          const mMenuProperties = mMenidToProperties[m.Menid] || {};
          if (!mMenuProperties.Mnurl) {
            return;
          }
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            aFavoriteMenids.push(m.Menid);
          }

          mMenidToProperties[m.Mnid3] = $.extend(true, mMenuProperties, {
            Level: 3,
            Mnid1: m.Mnid1,
            Mnid2: m.Mnid2,
            Mnid3: m.Mnid3,
            Mname: m.Mnnm3,
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
          });

          const aLevel2SubMenu = mLevel2Sub[m.Mnid2];
          if (aLevel2SubMenu) {
            aLevel2SubMenu.push(mMenuProperties);
          } else {
            mLevel2Sub[m.Mnid2] = [mMenuProperties];
          }
        });

        // 2nd level 메뉴 속성 정리
        aLevel2.map((m) => {
          const mMenuProperties = mMenidToProperties[m.Menid] || {};
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            aFavoriteMenids.push(m.Menid);
          }

          mMenidToProperties[m.Mnid2] = $.extend(true, mMenuProperties, {
            Level: 2,
            Menid: m.Menid,
            Mnid2: m.Mnid2,
            Mname: m.Mnnm2,
            Mnurl: !m.Menid ? '' : mMenuProperties.Mnurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
            Children: mLevel2Sub[m.Mnid2] || [],
          });

          const aLevel1SubMenu = mLevel1Sub[m.Mnid1];
          if (aLevel1SubMenu) {
            aLevel1SubMenu.push(mMenuProperties);
          } else {
            mLevel1Sub[m.Mnid1] = [mMenuProperties];
          }
        });

        // Top level 메뉴 속성 정리
        const tree = aLevel1.map((m) => {
          const mMenuProperties = mMenidToProperties[m.Menid] || {};
          if (m.Hide === 'X') {
            return;
          }
          if (m.Favor === 'X') {
            aFavoriteMenids.push(m.Menid);
          }

          mMenidToProperties[m.Mnid1] = $.extend(true, mMenuProperties, {
            Level: 1,
            Menid: m.Menid,
            Mnid1: m.Mnid1,
            Mname: m.Mnnm1,
            Mnurl: !m.Menid ? '' : mMenuProperties.Mnurl || '',
            Mepop: m.Mepop === 'X',
            Favor: m.Favor === 'X',
            Pwchk: m.Pwchk === 'X',
            Children: mLevel1Sub[m.Mnid1] || [],
            StyleClasses: this.getStyleClasses(m),
          });

          return mMenuProperties;
        });

        return {
          tree,
          menidToProperties: mMenidToProperties,
          urlToMenid: mUrlToMenid,
          favoriteMenids: aFavoriteMenids,
          current: {},
          breadcrumbs: {},
        };
      },

      getStyleClasses(m) {
        return m.Mnid1 === '70000' ? 'menu-70000' : m.Mnid1 === '80000' ? 'menu-80000' : m.Mnid1 === 'X0000' ? 'menu-sample' : '';
      },

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
              Menid: 'X150',
              Mnurl: 'sampleDatePicker',
              Mentx: 'DatePicker',
            },
            {
              Pinfo: '',
              Menid: 'X160',
              Mnurl: 'sampleVacationIndicator',
              Mentx: 'VacationIndicator',
            },
            {
              Pinfo: '',
              Menid: 'X170',
              Mnurl: 'sampleOrgChart',
              Mentx: 'OrgChart',
            },
            {
              Pinfo: '',
              Menid: 'X180',
              Mnurl: 'sampleYearPlan',
              Mentx: 'YearPlan',
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
              Mnid2: 'X1000',
              Mnid3: 'X150',
              Mnnm3: 'DatePicker',
              Mnsrt: '005',
              Menid: 'X150',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X160',
              Mnnm3: 'VacationIndicator',
              Mnsrt: '006',
              Menid: 'X160',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X170',
              Mnnm3: 'OrgChart',
              Mnsrt: '007',
              Menid: 'X170',
              Mepop: '',
              Device: 'A',
              Mnetc: '',
              Pwchk: '',
              Favor: '',
            },
            {
              Mnid1: 'X0000',
              Mnid2: 'X1000',
              Mnid3: 'X180',
              Mnnm3: 'YearPlan',
              Mnsrt: '008',
              Menid: 'X180',
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
      },

      getTree() {
        return this.getProperty('/tree');
      },

      getProperties(sMenid) {
        if (sMenid) {
          return this.getProperty(`/menidToProperties/${sMenid}`);
        }
        return this.getProperty(`/menidToProperties`);
      },

      getMenid(sUrl) {
        return this.getProperty('/urlToMenid')[sUrl];
      },

      getFavoriteMenids() {
        return this.getProperty('/favoriteMenids');
      },

      /**
       * 현재 메뉴 라우팅 정보 저장
       * @param {string} routeName
       * @param {string} viewId
       * @param {string} menuId
       * @param {string} currentLocationText
       */
      setCurrentMenuData({ routeName, viewId, menuId, currentLocationText = '', isSubRoute = false }) {
        this.setProperty('/breadcrumbs', {
          currentLocationText: '',
          links: null,
        });

        const mCurrentMenuProperties = this.getProperties(menuId);
        const iLevel = isSubRoute ? 4 : mCurrentMenuProperties.Level;
        const aLinks = [];
        let mMenuProperties;

        switch (iLevel) {
          case 4:
            mMenuProperties = this.getProperties(mCurrentMenuProperties.Mnid3);
            aLinks.unshift({ name: mMenuProperties.Mname });
          case 3:
            mMenuProperties = this.getProperties(mCurrentMenuProperties.Mnid2);
            aLinks.unshift({ name: mMenuProperties.Mname });
          case 2:
            mMenuProperties = this.getProperties(mCurrentMenuProperties.Mnid1);
            aLinks.unshift({ name: mMenuProperties.Mname });
          case 1:
          default:
        }

        this.setProperty('/breadcrumbs/currentLocationText', currentLocationText || mCurrentMenuProperties.Mname);
        this.setProperty('/breadcrumbs/links', aLinks);
        this.setProperty('/current', { routeName, viewId, menuId, currentLocationText: currentLocationText || mCurrentMenuProperties.Mname });
      },

      getCurrentMenuRouteName() {
        return this.getProperty('/current/routeName');
      },

      getCurrentMenuViewId() {
        return this.getProperty('/current/viewId');
      },

      getCurrentMenuId() {
        return this.getProperty('/current/menuId');
      },
    });
  }
);
