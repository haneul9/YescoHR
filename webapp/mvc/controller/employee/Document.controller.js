sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/table/Table',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/PostcodeDialogHandler',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    CSSGrid,
    Filter,
    FilterOperator,
    Table,
    AppUtils,
    DateUtils,
    ComboEntry,
    ODataReadError,
    ServiceNames,
    PostcodeDialogHandler,
    Validator,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.Document', {
      PostcodeDialogHandler: null,

      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },

      initializeModel() {
        return {
          busy: false,
          pernr: null,
          orgtx: null,
          orgeh: null,
          sideNavigation: {
            isShow: true,
            busy: false,
            selectedKey: 'list',
            width: '27%',
            height: '900px',
            scrollHeight: '700px',
            treeHeight: '500px',
            search: {
              searchText: '',
              selectedState: '3',
              results: [],
            },
            treeLoaded: false,
            treeData: [],
          },
          employee: {
            width: '73%',
            busy: true,
            header: {
              profilePath: 'asset/image/avatar-unknown.svg',
              baseInfo: [],
              timeline: null,
            },
            tab: {
              list: [],
            },
            sub: {},
            dialog: {
              subKey: null,
              subLabel: null,
              action: null,
              actionText: null,
              typeList: new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }),
              sidoList: new ComboEntry({ codeKey: 'State', valueKey: 'Bezei' }),
              schoolTypeList: new ComboEntry({ codeKey: 'Slart', valueKey: 'Stext' }),
              degreeList: new ComboEntry({ codeKey: 'Slabs', valueKey: 'Stext' }),
              languageTypeList: new ComboEntry({ codeKey: 'Quali', valueKey: 'Qualitx' }),
              examTypeList: new ComboEntry({ codeKey: 'Exmty', valueKey: 'Exmtytx' }),
              gradeList: new ComboEntry({ codeKey: 'Eamgr', valueKey: 'Eamgrtx' }),
              school1Entry: new ComboEntry({
                aEntries: [
                  { code: 'A', text: this.getBundleText('LABEL_00294') }, // 입사후
                  { code: 'B', text: this.getBundleText('LABEL_00295') }, // 입사전
                ],
              }),
              school2Entry: new ComboEntry({
                aEntries: [
                  { code: 'A', text: this.getBundleText('LABEL_00296') }, // 신입
                  { code: 'B', text: this.getBundleText('LABEL_00297') }, // 편입
                ],
              }),
              school3Entry: new ComboEntry({
                aEntries: [
                  { code: 'A', text: this.getBundleText('LABEL_00298') }, // 주간
                  { code: 'B', text: this.getBundleText('LABEL_00299') }, // 야간
                ],
              }),
              countryList: [],
              schoolList: [],
              majorList: [],
              certificateList: [],
              certificateGradeList: [],
              busy: { Slabs: false, Exmty: false },
              file: {
                originFile: [],
                newFile: [],
                settings: {
                  maximumFileSize: 10,
                  fileType: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'bmp', 'gif', 'png', 'txt', 'pdf', 'jpeg'],
                },
              },
              form: {},
              selectedHelpDialog: {},
            },
          },
        };
      },

      onBeforeShow() {
        this.PostcodeDialogHandler = new PostcodeDialogHandler(this, this.callbackPostcode.bind(this));
      },

      onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const sRoute = this.getRouter().getHashChanger().getHash();
        const mSessionData = this.getAppointeeData();
        let sPernr = oParameter.pernr || mSessionData.Pernr;
        let sOrgtx = _.replace(oParameter.orgtx, /--/g, '/') ?? _.noop();
        let sOrgeh = oParameter.orgeh ?? _.noop();

        // MSS process
        if (_.isEqual(sRoute, 'm/employee')) {
          sPernr = mSessionData.Pernr;
          sOrgtx = mSessionData.Orgtx;
          sOrgeh = mSessionData.Orgeh;
        }

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/sideNavigation/busy', true);
        oViewModel.setProperty('/pernr', sPernr);
        oViewModel.setProperty('/orgtx', sOrgtx);
        oViewModel.setProperty('/orgeh', sOrgeh);

        if (!_.isEmpty(sOrgtx)) {
          oViewModel.setProperty('/sideNavigation/search/searchText', sOrgtx);
        }

        this.initialList({ oViewModel, sPernr, sOrgtx, sOrgeh });
        if (!_.isEqual(sPernr, 'NA')) this.loadProfile({ oViewModel, sPernr });
      },

      async initialList({ oViewModel, sPernr, sOrgtx, sOrgeh }) {
        const oSideBody = this.byId('sideBody');
        const oSideList = this.byId('sideEmployeeList');
        const sSearchText = _.isEmpty(sOrgtx) ? sPernr : sOrgtx;
        const sSearchOrgeh = _.isEmpty(sOrgeh) ? _.noop() : sOrgeh;
        const aSearchResults = await this.readEmpSearchResult({ searchText: sSearchText, Orgeh: sSearchOrgeh });
        const iSideViewHeight = Math.floor($(document).height() - oSideBody.getParent().$().offset().top - 20);
        const iScrollViewHeight = Math.floor($(document).height() - oSideList.getParent().$().offset().top - 36);

        oSideList.getBinding('items').filter([new Filter('Stat2', FilterOperator.EQ, '3')]);

        oViewModel.setProperty(
          '/sideNavigation/search/results',
          _.map(aSearchResults, (o) => ({ ...o, Photo: _.isEmpty(o.Photo) ? 'asset/image/avatar-unknown.svg?ssl=1' : o.Photo }))
        );
        oViewModel.setProperty('/sideNavigation/height', `${iSideViewHeight}px`);
        oViewModel.setProperty('/sideNavigation/scrollHeight', `${iScrollViewHeight}px`);
        oViewModel.setProperty('/sideNavigation/busy', false);

        if (_.isEqual(sPernr, 'NA')) {
          const sFirstPernr = _.get(aSearchResults, [0, 'Pernr'], _.noop());
          this.loadProfile({ oViewModel, sPernr: sFirstPernr });
        }
      },

      async loadProfile({ oViewModel, sPernr }) {
        const oViewModelData = oViewModel.getData();
        const oModel = this.getModel(ServiceNames.PA);
        let mFilters = {};
        let aHeaderRequests = [];
        let aContentRequests = [];

        if (sPernr) mFilters.Pernr = sPernr;

        try {
          // 1. 상단 프로필, 탭 메뉴, 주소유형, 시/도
          const [
            aProfileReturnData, //
            aMilestoneReturnData,
            aMenuReturnData,
            aCountryList,
            aMajorList,
            aCertList,
            aCertGradeList,
            aAddressTypeData,
            aAddressCityData,
            aSchoolTypeList,
            aLanguageTypeList,
            aTestGradeList,
          ] = await Promise.all([
            this.readOdata({ sUrl: '/EmpProfileHeaderNewSet', mFilters }),
            this.readOdata({ sUrl: '/EmpProfileMilestoneSet', mFilters }),
            this.readOdata({ sUrl: '/EmpProfileMenuSet', mFilters }),
            this.readOdata({ sUrl: '/CountryCodeSet' }),
            this.readOdata({ sUrl: '/MajorCodeSet' }),
            this.readOdata({ sUrl: '/CertificateCodeSet' }),
            this.readOdata({ sUrl: '/CertificateGradeCodeSet' }),
            this.readComboEntry({ oModel, sUrl: '/PaCodeListSet', sPath: 'typeList', mFilters: { Cdnum: 'CM0002', Grcod: '0006' } }),
            this.readComboEntry({ oModel, sUrl: '/CityListSet', sPath: 'sidoList', sPernr, mEntryInfo: { codeKey: 'State', valueKey: 'Bezei' } }),
            this.readComboEntry({ oModel, sUrl: '/SchoolTypeCodeSet', sPath: 'schoolTypeList', mEntryInfo: { codeKey: 'Slart', valueKey: 'Stext' } }),
            this.readComboEntry({ oModel, sUrl: '/LanguageTypeCodeSet', sPath: 'languageTypeList', mEntryInfo: { codeKey: 'Quali', valueKey: 'Qualitx' } }),
            this.readComboEntry({ oModel, sUrl: '/TestGradeCodeSet', sPath: 'gradeList', mEntryInfo: { codeKey: 'Eamgr', valueKey: 'Eamgrtx' } }),
          ]);

          // Milestone set
          oViewModel.setProperty('/employee/header/timeline', _.map(aMilestoneReturnData, (o) => ({ ...o, Datum: DateUtils.format(o.Datum) })) || _.noop());

          // Dialog Combo entry set
          oViewModel.setProperty('/employee/dialog/countryList', aCountryList);
          oViewModel.setProperty('/employee/dialog/majorList', aMajorList);
          oViewModel.setProperty('/employee/dialog/typeList', aAddressTypeData);
          oViewModel.setProperty('/employee/dialog/sidoList', aAddressCityData);
          oViewModel.setProperty('/employee/dialog/schoolTypeList', aSchoolTypeList);
          oViewModel.setProperty('/employee/dialog/languageTypeList', aLanguageTypeList);
          oViewModel.setProperty('/employee/dialog/gradeList', aTestGradeList);
          oViewModel.setProperty('/employee/dialog/certificateList', aCertList);
          oViewModel.setProperty('/employee/dialog/certificateGradeList', aCertGradeList);
          //End Dialog Combo entry set

          // 상단 프로필 Set
          const { Pturl, ...oReturnData } = aProfileReturnData[0];
          const aTextFields = ['Dat03', 'Dat05', 'Dat08', 'Dat10', 'Dat13', 'Dat15', 'Dat18', 'Dat20', 'Dat23', 'Dat25'];
          const aConvertData = _.chain(oReturnData)
            .pickBy((v, p) => _.startsWith(p, 'Dat'))
            .map((v, k) => ({ data: v, labelOrText: _.includes(aTextFields, k) ? 'text' : 'label' }))
            .value();

          oViewModel.setProperty('/employee/header/profilePath', _.isEmpty(Pturl) ? 'asset/image/avatar-unknown.svg?ssl=1' : Pturl);
          oViewModel.setProperty('/employee/header/baseInfo', aConvertData);
          //End 상단 프로필 Set

          // 탭 메뉴 Set
          const aTabMenus = _.chain(aMenuReturnData)
            .filter({ Child: '1' })
            .map((obj, index) => _.assignIn({ Pressed: index === 0 }, obj))
            .value();
          const aSubMenus = _.filter(aMenuReturnData, (o) => o.Child !== '1');

          oViewModel.setProperty('/employee/tab/list', aTabMenus);
          oViewModel.setProperty('/employee/tab/menu', aSubMenus);

          aTabMenus.forEach((data) => {
            this.debug(`Tab ${data.Menu1}`, data);

            _.set(oViewModelData, ['employee', 'sub', data.Menuc1], { contents: {} });

            aHeaderRequests.push(this.readOdata({ sUrl: '/EmpProfileHeaderTabSet', mFilters: { Menuc: data.Menuc1, ...mFilters } }));
            aContentRequests.push(this.readOdata({ sUrl: '/EmpProfileContentsTabSet', mFilters: { Menuc: data.Menuc1, ...mFilters } }));
          });

          aSubMenus.forEach((data) => {
            _.set(oViewModelData, ['employee', 'sub', data.Menuc1, 'contents', data.Menuc2], {
              type: data.Child,
              rowCount: 1,
              selectionMode: _.some(this.CRUD_TABLES, (o) => o.key === data.Menuc2) ? 'MultiToggle' : 'None',
              title: data.Menu2,
              code: data.Menuc2,
              sort: data.Sorts,
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
            headers.forEach((o, i) => _.set(oViewModelData, ['employee', 'sub', aTabMenus[index].Menuc1, 'contents', o.Menuc, 'header', i], o));
          });
          //End Header 영역 Set

          // Contents 영역 Set
          aContentReturnData.forEach((content, index) => {
            content.forEach((o) => {
              let mSubMenu = _.get(oViewModelData, ['employee', 'sub', aTabMenus[index].Menuc1, 'contents', o.Menuc]);

              if (mSubMenu.type === this.SUB_TYPE.GRID) {
                for (let i = 1; i <= mSubMenu.header.length; i++) {
                  let sKey = `Value${_.padStart(i, 2, '0')}`;
                  mSubMenu.data.push(o[sKey]);
                }
              } else if (mSubMenu.type === this.SUB_TYPE.TABLE) {
                mSubMenu.data.push(o);
              }

              mSubMenu.rowCount = mSubMenu.data.length;
            });
          });
          //End Contents 영역 Set

          oViewModel.setData(oViewModelData);

          // Sub 영역 UI5 Control 생성
          this.makeProfileBody();
        } catch (oError) {
          this.debug('Controller > Employee > loadProfile Error', oError);

          AppUtils.handleError(oError);
        } finally {
          sap.ui.getCore().byId('container-ehr---app--appMenuToolbar').setVisible(false);
          oViewModel.setProperty('/employee/busy', false);
        }
      },

      makeProfileBody() {
        const oViewModel = this.getViewModel();
        const oParentBox = this.byId('profileBody');
        const aProfileTabItems = this.byId('profileTabBar').getItems();
        const aSubMenu = oViewModel.getProperty('/employee/sub');

        Object.keys(aSubMenu).forEach((menuKey) => {
          const aSubMenuContents = _.get(aSubMenu, [menuKey, 'contents']);
          const oTabContainer = _.find(aProfileTabItems, (o) => _.isEqual(o.getProperty('key'), menuKey));
          let oWrapperVBox = sap.ui.getCore().byId(`sub${menuKey}`);

          if (oWrapperVBox) {
            oWrapperVBox.destroyItems();
            oParentBox.removeItem(oWrapperVBox);
          } else {
            oWrapperVBox = new sap.m.VBox({ id: `sub${menuKey}`, visible: true });
          }

          /**
           * OMenu.type: '5'  Table
           *      - 주소 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(aSubMenuContents).forEach((key) => {
            const mMenu = _.get(aSubMenuContents, key);
            const oSubVBox = new sap.m.VBox().addStyleClass('customBox sapUiMediumMarginBottom');
            const oSubHBox = new sap.m.HBox({ justifyContent: 'SpaceBetween' }).addStyleClass('table-toolbar');

            this.debug(`Sub ${mMenu.title}`, mMenu);

            // Title
            oSubHBox.addItem(new sap.m.Title({ level: 'H2', text: mMenu.title }));
            oSubVBox.addItem(oSubHBox);

            // Content (Table|Grid)
            if (mMenu.type === this.SUB_TYPE.TABLE) {
              const sTableDataPath = `/employee/sub/${menuKey}/contents/${key}`;
              const aVisibleHeaders = _.filter(mMenu.header, { Invisible: false });
              const oTable = new Table({
                width: '100%',
                columnHeaderHeight: 45,
                rowHeight: 45,
                enableSelectAll: false,
                selectionMode: { path: `${sTableDataPath}/selectionMode` },
                visibleRowCount: { path: `${sTableDataPath}/rowCount` },
                noData: this.getBundleText('MSG_00001'),
              }).bindRows(`${sTableDataPath}/data`);

              aVisibleHeaders.forEach((head, index) => {
                const oColumn = new sap.ui.table.Column({ width: _.isEqual(head.Width, '000') ? 'auto' : `${_.toNumber(head.Width)}%` });

                oColumn.setLabel(new sap.m.Label({ text: head.Header }));
                oColumn.setTemplate(new sap.m.Text({ width: '100%', textAlign: _.isEmpty(head.Align) ? 'Center' : head.Align, text: { path: `Value${_.padStart(index + 1, 2, '0')}` } }));
                oTable.addColumn(oColumn);
              });

              oSubVBox.addItem(oTable);
            } else if (mMenu.type === this.SUB_TYPE.GRID) {
              const oCSSGrid = new CSSGrid({ gridTemplateColumns: '1fr 3fr 1fr 3fr', gridGap: '1px 0px' }).addStyleClass('form-grid');

              mMenu.header.forEach((head, index) => {
                oCSSGrid.addItem(new sap.m.Label({ text: head.Header }));
                oCSSGrid.addItem(new sap.m.Input({ value: mMenu.data[index], editable: false }));
              });

              if (mMenu.header.length % 2 === 1) {
                oCSSGrid.addItem(new sap.m.Label({ text: '' }));
                oCSSGrid.addItem(new sap.m.Input({ value: '', editable: false }));
              }

              oSubVBox.addItem(oCSSGrid);
            }

            oWrapperVBox.addItem(oSubVBox);
          });

          oTabContainer.addContent(oWrapperVBox);
        });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      readEmpSearchResult({ searchText, Orgeh }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.COMMON);
          const sUrl = '/EmpSearchResultSet';
          const aFilters = [
            new Filter('Zflag', FilterOperator.EQ, 'X'), //
            new Filter('Actda', FilterOperator.EQ, moment().hour(9).toDate()),
            new Filter('Ename', FilterOperator.EQ, searchText),
          ];

          if (!_.isEmpty(Orgeh)) aFilters.push(new Filter('Orgeh', FilterOperator.EQ, Orgeh));

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readComboEntry({ oModel, sUrl, sPath, sPernr, mFilters = {}, mEntryInfo = { codeKey: 'Zcode', valueKey: 'Ztext' } }) {
        return new Promise((resolve, reject) => {
          const oViewModel = this.getViewModel();
          const mEntries = oViewModel.getProperty(`/employee/dialog/${sPath}`);

          if (sPath && mEntries.length > 1) resolve(mEntries);
          if (sPernr) mFilters.Pernr = sPernr;

          oModel.read(sUrl, {
            filters: _.map(mFilters, (v, p) => new Filter(p, FilterOperator.EQ, v)),
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(new ComboEntry({ ...mEntryInfo, aEntries: oData.results }));
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readOdata({ sUrl, mFilters = {} }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.PA);

          oModel.read(sUrl, {
            filters: _.map(mFilters, (v, p) => new Filter(p, FilterOperator.EQ, v)),
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError)); // {조회}중 오류가 발생하였습니다.
            },
          });
        });
      },
    });
  }
);
