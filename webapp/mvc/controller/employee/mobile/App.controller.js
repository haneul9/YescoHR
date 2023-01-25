sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/CustomListItem',
    'sap/m/FlexItemData',
    'sap/m/Input',
    'sap/m/Label',
    'sap/m/List',
    'sap/m/Text',
    'sap/m/Title',
    'sap/m/VBox',
    'sap/ui/core/Fragment',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/yesco/control/mobile/ScrollContainer',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/talentDev/employeeView/MobileTalentDevPopoverHandler',
  ],
  (
    // prettier 방지용 주석
    CustomListItem,
    FlexItemData,
    Input,
    Label,
    List,
    Text,
    Title,
    VBox,
    Fragment,
    CSSGrid,
    MobileScrollContainer,
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    MobileTalentDevPopoverHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.mobile.App', {
      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },
      LIST_GRID_TEMPLATE: {
        // HACT: '1fr 2fr', // 발령
        // '0006': '1fr 2fr', // 주소
        // 9002: '1fr 2fr', // 어학
        // JOBL: '1fr 2fr', // 직무이력
        // '0545': '1fr 2fr', // 징계
        // '0023': '1fr 2fr', // 사외경력
        // '0105': '1fr 2fr', // 연락처
        // INCR: '1fr 2fr', // 사내경력
        9001: '1fr 3fr', // 평가
        PAYS: '1fr 1fr', // 급여
        '0022': '4fr 5fr', // 학력
        9006: '4fr 4fr 3fr', // 자격
        '0183': '1fr 1fr 1fr', // 포상
        '0021': '1fr 1fr 1fr', // 가족
        EDU1: '1fr 1fr', // 교육
        JOBC: '1fr 1fr', // 직무경력
        JOBL: '1fr 1fr', // 직무이력
        S031: '3fr 5fr', // 승계 후보자 선정 결과 (본인)
        S032: '3fr 5fr', // 승계 후보자 선정 결과 (후임자)
      },
      COMPANY_ICON: {
        1000: AppUtils.getImageURL('icon_YH.svg'),
        2000: AppUtils.getImageURL('icon_YS.svg'),
        3000: AppUtils.getImageURL('icon_HS.svg'),
        4000: AppUtils.getImageURL('icon_YI.svg'),
        5000: AppUtils.getImageURL('icon_YH.svg'),
      },

      initializeModel() {
        return {
          busy: false,
          pernr: null,
          header: {
            profilePath: this.getUnknownAvatarImageURL(),
            name: '',
            chief: false,
            baseInfo: [],
          },
          tab: {
            selectedKey: '',
            list: [],
            menu: [],
          },
          sub: {},
        };
      },

      onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const sPernr = oParameter.pernr || this.getSessionData().Pernr;

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.loadProfile({ oViewModel, sPernr });
      },

      async loadProfile({ oViewModel, sPernr }) {
        try {
          const oViewModelData = oViewModel.getData();
          const fCurriedPA = Client.getEntitySet(this.getModel(ServiceNames.PA));
          const mFilters = { Pernr: sPernr, Mobile: 'X' };
          const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

          // 1. 상단 프로필, 탭 메뉴
          const [
            aProfileReturnData, //
            aMenuReturnData,
          ] = await Promise.all([
            fCurriedPA('EmpProfileHeaderNew', mFilters), //
            fCurriedPA('EmpProfileMenu', { ..._.pick(mFilters, 'Pernr'), Usrty: sUsrty }),
          ]);

          // 상단 프로필 Set
          const { Pturl, Dat01, Dat08, ...oReturnData } = aProfileReturnData[0];

          _.chain(oViewModelData)
            .set(['header', 'profilePath'], _.isEmpty(Pturl) ? this.getUnknownAvatarImageURL() : Pturl)
            .set(['header', 'name'], Dat01)
            .set(['header', 'chief'], _.isEqual(Dat08, 'X'))
            .set(
              ['header', 'baseInfo'],
              _.chain(oReturnData)
                .pick(['Dat02', 'Dat03', 'Dat04'])
                .map((v) => ({ data: v, labelOrText: 'text' }))
                .value()
            )
            .commit();
          //End 상단 프로필 Set

          // 탭 메뉴 Set
          const aSubMenus = _.filter(aMenuReturnData, (o) => o.Child !== '1');
          const aTabMenus = _.chain(aMenuReturnData)
            .filter({ Child: '1' })
            .map((obj, index) => _.assignIn({ Pressed: index === 0 }, obj))
            .value();

          _.chain(oViewModelData)
            .set(['tab', 'list'], aTabMenus)
            .set(['tab', 'menu'], aSubMenus)
            .set(['tab', 'selectedKey'], _.get(aTabMenus, [0, 'Menuc1']))
            .commit();

          const aHeaderRequests = [];
          const aContentRequests = [];

          _.forEach(aTabMenus, (data) => {
            this.debug(`Tab ${data.Menu1}`, data);

            _.set(oViewModelData, ['sub', data.Menuc1], { contents: {} });

            aHeaderRequests.push(fCurriedPA('EmpProfileHeaderTab', { Menuc: data.Menuc1, ...mFilters, Usrty: sUsrty }));
            aContentRequests.push(fCurriedPA('EmpProfileContentsTab', { Menuc: data.Menuc1, ...mFilters, Usrty: sUsrty }));
          });

          _.forEach(aSubMenus, (data) => {
            let mContentData;
            if (data.Menuc1 === 'M030') {
              // Succession tab
              mContentData = {
                type: data.Child,
                title: data.Menu2,
                code: data.Menuc2,
                data: [],
                map: {},
              };
            } else {
              mContentData = {
                type: data.Child,
                title: data.Menu2,
                code: data.Menuc2,
                sort: data.Sorts,
                gridTemplate: '2fr 3fr',
                header: [],
                data: [],
              };
            }
            _.set(oViewModelData, ['sub', data.Menuc1, 'contents', data.Menuc2], mContentData);
          });
          //End 탭 메뉴 Set

          // 2. Sub 영역 조회[header, contents]
          const aHeaderReturnData = await Promise.all(aHeaderRequests);
          const aContentReturnData = await Promise.all(aContentRequests);

          // Header 영역 Set
          aHeaderReturnData.forEach((headers, index) => {
            const sTabCode = aTabMenus[index].Menuc1;
            if (sTabCode === 'M030') {
              // Succession tab
              _.chain(oViewModelData)
                .get(['sub', sTabCode, 'contents'])
                .defaultsDeep(
                  _.chain(headers) //
                    .filter((mHeader) => _.includes(['HEADER1_1', 'HEADER2_1', 'NTXPLN', 'TSCSPNT'], mHeader.Fieldname))
                    .reduce((acc, { Menuc, Fieldname, Header }) => _.defaultsDeep(acc, { [Menuc]: { label: { [Fieldname]: Header } } }), {})
                    .value()
                )
                .value();
            } else {
              headers.forEach((o, i) => _.set(oViewModelData, ['sub', sTabCode, 'contents', o.Menuc, 'header', i], o));
            }
          });
          //End Header 영역 Set

          // Contents 영역 Set
          aContentReturnData.forEach((content, index) => {
            const sTabCode = aTabMenus[index].Menuc1;
            content.forEach((o) => {
              let mSubMenu = _.get(oViewModelData, ['sub', sTabCode, 'contents', o.Menuc]);

              if (mSubMenu.type === this.SUB_TYPE.GRID) {
                for (let i = 1; i <= mSubMenu.header.length; i++) {
                  let sKey = `Value${_.padStart(i, 2, '0')}`;
                  mSubMenu.data.push(o[sKey]);
                }
              } else if (mSubMenu.type === this.SUB_TYPE.TABLE) {
                mSubMenu.gridTemplate = _.get(this.LIST_GRID_TEMPLATE, o.Menuc, mSubMenu.gridTemplate);

                if (sTabCode === 'M020') {
                  // 인재육성위원회 tab
                  mSubMenu.data.push({
                    contents: [{ valueTxt: o.Value01 }, { valueTxt: o.Value02 }],
                    popoverParams: { Pernr: o.Pernr, Gjahr: o.Value01.replace(/\D/g, ''), Mdate: o.Value06, Zseqnr: o.Value07 },
                  });
                } else if (sTabCode === 'M030') {
                  // Succession tab
                  const aPositionFields = 'Value01,Value02,Value03,Value04,Value05,Value10,Value11,Value13,Photo01'.split(/,/);
                  const aNomineeFields = 'Value06,Value07,Value08,Value09,Value10,Value12,Value14,Photo02'.split(/,/);
                  const mNomineeData = _.chain(o).pick(aNomineeFields).set('Icon2', this.COMPANY_ICON[o.Value12]).set('Box', o.Menuc).value();
                  const sPositionKey = [o.Value01, o.Value02].join();
                  const mPositionData = mSubMenu.map[sPositionKey];
                  if (mPositionData) {
                    mPositionData.nominees.push(mNomineeData);
                  } else {
                    const mData = _.chain(o) //
                      .pick(aPositionFields)
                      .set('Icon1', this.COMPANY_ICON[o.Value11])
                      .set('Box', o.Menuc) // S031 or S032
                      .set('Header1_1', mSubMenu.label.HEADER1_1) //
                      .set('Header2_1', mSubMenu.label.HEADER2_1) //
                      .set('Ntxpln', mSubMenu.label.NTXPLN) // 차년도 계획
                      .set('Tscspnt', mSubMenu.label.TSCSPNT) // 승계예정시점
                      .set('nominees', [mNomineeData])
                      .value();
                    mSubMenu.data.push(mData);
                    mSubMenu.map[sPositionKey] = mData;
                  }
                } else {
                  mSubMenu.data.push({
                    contents: _.chain(o)
                      .pickBy((v, p) => _.startsWith(p, 'Value') && !_.isEmpty(v))
                      .map((v) => ({ valueTxt: v === '-' ? '' : v }))
                      .value(),
                  });
                }
              }
            });
          });
          //End Contents 영역 Set

          oViewModel.setData(oViewModelData, true);

          // Sub 영역 UI5 Control 생성
          this.makeProfileBody();
        } catch (oError) {
          this.debug('Controller > Mobile-Employee-App > loadProfile Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false).setMenuBusy(false);
          oViewModel.setProperty('/busy', false);
        }
      },

      makeProfileBody() {
        const oViewModel = this.getViewModel();
        const aTabItems = this.byId('employeeTabBar').getItems();
        const aSubMenu = oViewModel.getProperty('/sub');

        Object.keys(aSubMenu).forEach((sMenuKey) => {
          const aSubMenuContents = _.get(aSubMenu, [sMenuKey, 'contents']);
          const oTabContainer = _.find(aTabItems, (o) => _.isEqual(o.getProperty('key'), sMenuKey));
          const oScrollContainer = new MobileScrollContainer();
          let oWrapperVBox = sap.ui.getCore().byId(`sub${sMenuKey}`);

          if (oWrapperVBox) {
            oWrapperVBox.destroyItems();
          } else {
            oWrapperVBox = new VBox({ id: `sub${sMenuKey}`, visible: true });
          }

          /**
           * OMenu.type: '5'  Table
           *      - 주소 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(aSubMenuContents).forEach((sKey) => {
            const mMenu = _.get(aSubMenuContents, sKey);
            const oSubVBox = new VBox().addStyleClass('profile-detail');

            this.debug(`Sub ${mMenu.title}`, mMenu, sMenuKey, sKey);

            // Title
            oSubVBox.addItem(new Title({ level: 'H4', text: mMenu.title }));

            // Content (Table|Grid)
            if (mMenu.type === this.SUB_TYPE.TABLE) {
              const sTableDataPath = `/sub/${sMenuKey}/contents/${sKey}`;
              if (sMenuKey === 'M030') {
                // Succession tab
                if (mMenu.data.length) {
                  this.addSuccessionTabContents(oSubVBox, sTableDataPath);
                } else {
                  oSubVBox.addItem(
                    new sap.m.HBox({
                      width: '100%',
                      items: new sap.m.Title({ text: '{i18n>MSG_00001}' }),
                    }).addStyleClass('succession-card no-data')
                  );
                }
              } else {
                const aTabTypes = [
                  'M000,HACT', // 발령
                  'M002,0555', // 병역
                  'M002,0557', // 보훈
                  'M002,0555', // 병역
                  'M002,DISA', // 장애
                  'M003,0022', // 학력
                  'M005,9006', // 자격
                  'M006,9002', // 어학
                  'M007,JOBC', // 직무경력
                  'M007,JOBL', // 직무이력
                  'M008,0183', // 포상
                  'M008,0545', // 징계
                  'M009,0023', // 사외경력
                  'M009,INCR', // 사내경력
                  'M010,0021', // 가족
                  'M012,9001', // 평가
                ];
                const oTemplateText = new Text({ text: '{valueTxt}' });
                if (!aTabTypes.includes(`${sMenuKey},${sKey}`)) {
                  oTemplateText.addStyleClass('profile-detail-list-text'); // label 용도 text 회색 처리용 style class
                }
                const oList = new List({
                  layoutData: new FlexItemData({ styleClass: 'profile-detail-list' }),
                  noDataText: this.getBundleText('MSG_00001'),
                  items: {
                    path: 'data',
                    templateShareable: false,
                    template: new CustomListItem({
                      content: new CSSGrid({
                        gridGap: '8px',
                        gridTemplateColumns: `{${sTableDataPath}/gridTemplate}`,
                        items: {
                          path: 'contents',
                          templateShareable: false,
                          template: oTemplateText,
                        },
                      }),
                      type: sMenuKey === 'M020' ? 'Active' : 'Inactive',
                    }),
                  },
                }).bindElement(sTableDataPath);

                if (sMenuKey === 'M020') {
                  // 인재육성위원회 tab
                  oList.attachItemPress((oEvent) => {
                    const mRowData = oEvent.getParameter('listItem').getBindingContext().getProperty('popoverParams');
                    const mHeaderData = this.getViewModel().getProperty('/header');

                    this.oMobileTalentDevPopoverHandler.openPopover(mHeaderData, mRowData);
                  });

                  this.oMobileTalentDevPopoverHandler = new MobileTalentDevPopoverHandler(this);
                }

                oSubVBox.addItem(oList);
              }
            } else if (mMenu.type === this.SUB_TYPE.GRID) {
              const oCSSGrid = new CSSGrid({ gridTemplateColumns: '2fr 3fr', gridGap: '11px 8px' });

              mMenu.header.forEach((head, index) => {
                oCSSGrid.addItem(new Label({ text: head.Header }));
                oCSSGrid.addItem(new Input({ value: mMenu.data[index], editable: false }));
              });

              oSubVBox.addItem(oCSSGrid);
            }

            oWrapperVBox.addItem(oSubVBox);
          });

          oScrollContainer.addContent(oWrapperVBox);
          oTabContainer.addContent(oScrollContainer);
        });
      },

      async addSuccessionTabContents(oSubVBox, sDataPath) {
        const oView = this.getView();
        const oSuccessionFragment = await Fragment.load({
          id: oView.getId(),
          name: `sap.ui.yesco.mvc.view.employee.mobile.Succession`,
          controller: this,
        });

        oSubVBox.addItem(oSuccessionFragment.bindElement(sDataPath));
      },
    });
  }
);
