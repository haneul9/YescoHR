sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/CustomListItem',
    'sap/m/Input',
    'sap/m/Label',
    'sap/m/List',
    'sap/m/Text',
    'sap/m/Title',
    'sap/m/VBox',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    CustomListItem,
    Input,
    Label,
    List,
    Text,
    Title,
    VBox,
    CSSGrid,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.mobile.App', {
      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },
      LIST_GRID_TEMPLATE: {
        HACT: '1fr 2fr',
        '0006': '1fr 2fr',
        '0022': '1fr 1fr 1fr',
        9002: '1fr 2fr',
        9006: '1fr 1fr 1fr',
        JOBL: '1fr 2fr',
        '0183': '1fr 1fr 1fr',
        '0545': '1fr 2fr',
        '0023': '1fr 2fr',
        INCR: '1fr 2fr',
        '0021': '1fr 1fr 1fr',
        EDU1: '1fr 1fr 1fr',
        9001: '1fr 2fr',
        PAYS: '1fr 2fr',
      },

      initializeModel() {
        return {
          busy: false,
          pernr: null,
          header: {
            profilePath: 'asset/image/avatar-unknown.svg',
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

          // 1. 상단 프로필, 탭 메뉴
          const [
            aProfileReturnData, //
            aMenuReturnData,
          ] = await Promise.all([
            fCurriedPA('EmpProfileHeaderNew', mFilters), //
            fCurriedPA('EmpProfileMenu', _.pick(mFilters, 'Pernr')),
          ]);

          // 상단 프로필 Set
          const aLabelFields = ['Dat02', 'Dat04', 'Dat06'];
          const aTextFields = ['Dat03', 'Dat05', 'Dat07'];
          const { Pturl, Dat01, Dat08, ...oReturnData } = aProfileReturnData[0];

          _.chain(oViewModelData)
            .set(['header', 'profilePath'], _.isEmpty(Pturl) ? 'asset/image/avatar-unknown.svg' : Pturl)
            .set(['header', 'name'], Dat01)
            .set(['header', 'chief'], _.isEqual(Dat08, 'X'))
            .set(
              ['header', 'baseInfo'],
              _.chain(oReturnData)
                .pick([...aLabelFields, ...aTextFields].sort())
                .map((v, k) => ({ data: v, labelOrText: _.includes(aTextFields, k) ? 'text' : 'label' }))
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

            aHeaderRequests.push(fCurriedPA('EmpProfileHeaderTab', { Menuc: data.Menuc1, ...mFilters }));
            aContentRequests.push(fCurriedPA('EmpProfileContentsTab', { Menuc: data.Menuc1, ...mFilters }));
          });

          _.forEach(aSubMenus, (data) => {
            _.set(oViewModelData, ['sub', data.Menuc1, 'contents', data.Menuc2], {
              type: data.Child,
              title: data.Menu2,
              code: data.Menuc2,
              sort: data.Sorts,
              gridTemplate: '1fr 2fr',
              header: [],
              data: [],
            });
          });
          //End 탭 메뉴 Set

          // 2. Sub 영역 조회[header, contents]
          const aHeaderReturnData = await Promise.all(aHeaderRequests);
          const aContentReturnData = await Promise.all(aContentRequests);

          // Header 영역 Set
          aHeaderReturnData.forEach((headers, index) => {
            headers.forEach((o, i) => _.set(oViewModelData, ['sub', aTabMenus[index].Menuc1, 'contents', o.Menuc, 'header', i], o));
          });
          //End Header 영역 Set

          // Contents 영역 Set
          aContentReturnData.forEach((content, index) => {
            content.forEach((o) => {
              let mSubMenu = _.get(oViewModelData, ['sub', aTabMenus[index].Menuc1, 'contents', o.Menuc]);

              if (mSubMenu.type === this.SUB_TYPE.GRID) {
                for (let i = 1; i <= mSubMenu.header.length; i++) {
                  let sKey = `Value${_.padStart(i, 2, '0')}`;
                  mSubMenu.data.push(o[sKey]);
                }
              } else if (mSubMenu.type === this.SUB_TYPE.TABLE) {
                mSubMenu.gridTemplate = this.LIST_GRID_TEMPLATE[o.Menuc];
                mSubMenu.data.push({
                  contents: _.chain(o)
                    .pickBy((v, p) => _.startsWith(p, 'Value') && !_.isEmpty(v))
                    .map((v) => ({ valueTxt: v }))
                    .value(),
                });
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
          oViewModel.setProperty('/busy', false);
        }
      },

      makeProfileBody() {
        const oViewModel = this.getViewModel();
        const aTabItems = this.byId('employeeTabBar').getItems();
        const aSubMenu = oViewModel.getProperty('/sub');

        Object.keys(aSubMenu).forEach((menuKey) => {
          const aSubMenuContents = _.get(aSubMenu, [menuKey, 'contents']);
          const oTabContainer = _.find(aTabItems, (o) => _.isEqual(o.getProperty('key'), menuKey));
          let oWrapperVBox = sap.ui.getCore().byId(`sub${menuKey}`);

          if (oWrapperVBox) {
            oWrapperVBox.destroyItems();
          } else {
            oWrapperVBox = new VBox({ id: `sub${menuKey}`, visible: true });
          }

          /**
           * OMenu.type: '5'  Table
           *      - 주소 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(aSubMenuContents).forEach((key) => {
            const mMenu = _.get(aSubMenuContents, key);
            const oSubVBox = new VBox().addStyleClass('customBox sapUiMediumMarginBottom');

            this.debug(`Sub ${mMenu.title}`, mMenu);

            // Title
            oSubVBox.addItem(new Title({ level: 'H2', text: mMenu.title }));

            // Content (Table|Grid)
            if (mMenu.type === this.SUB_TYPE.TABLE) {
              const sTableDataPath = `/sub/${menuKey}/contents/${key}`;
              const oListCSSGrid = new CSSGrid({
                gridGap: '1px 8px',
                gridTemplateColumns: { path: `${sTableDataPath}/gridTemplate` },
                items: {
                  path: 'contents',
                  templateShareable: false,
                  template: new Text({ text: '{valueTxt}' }),
                },
              });
              const oList = new List({
                noDataText: this.getBundleText('MSG_00001'),
                items: {
                  path: `${sTableDataPath}/data`,
                  templateShareable: false,
                  template: new CustomListItem().addContent(oListCSSGrid),
                },
              });

              oSubVBox.addItem(oList);
            } else if (mMenu.type === this.SUB_TYPE.GRID) {
              const oCSSGrid = new CSSGrid({ gridTemplateColumns: '1fr 3fr', gridGap: '1px 8px' });

              mMenu.header.forEach((head, index) => {
                oCSSGrid.addItem(new Label({ text: head.Header }));
                oCSSGrid.addItem(new Input({ value: mMenu.data[index], editable: false }));
              });

              if (mMenu.header.length % 2 === 1) {
                oCSSGrid.addItem(new Label({ text: '' }));
                oCSSGrid.addItem(new Input({ value: '', editable: false }));
              }

              oSubVBox.addItem(oCSSGrid);
            }

            oWrapperVBox.addItem(oSubVBox);
          });

          oTabContainer.addContent(oWrapperVBox);
        });
      },
    });
  }
);
