sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/CustomData',
    'sap/ui/core/Fragment',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/Table',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/PostcodeDialogHandler',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    CustomData,
    Fragment,
    CSSGrid,
    Filter,
    FilterOperator,
    JSONModel,
    Table,
    Appno,
    AppUtils,
    ComboEntry,
    FileDataProvider,
    PostcodeDialogHandler,
    Validator,
    Client,
    ServiceNames,
    UI5Error,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.Employee', {
      PostcodeDialogHandler: null,

      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },
      CRUD_TABLES: {
        ADDRESS: {
          key: '0006',
          label: 'LABEL_00283',
          path: 'address',
          odata: 'AddressInfo',
          pk: ['Subty', 'Begda'],
          valid: [
            { label: 'LABEL_00270', field: 'Subty', type: Validator.SELECT1 }, // 주소유형
            { label: 'LABEL_00271', field: 'Begda', type: Validator.INPUT1 }, // 적용시작일
            { label: 'LABEL_00272', field: 'State', type: Validator.SELECT2 }, // 시/도
            { label: 'LABEL_00273', field: 'Pstlz', type: Validator.INPUT2 }, // 우편번호
          ],
        },
        EDUCATION: {
          key: '0022',
          label: 'LABEL_00303',
          path: 'education',
          odata: 'EducationChange',
          pk: ['Subty', 'Seqnr', 'Seqnr2', 'Begda', 'Endda', 'Prcty'],
          valid: [
            { label: 'LABEL_00284', field: 'Slart', type: Validator.SELECT1 }, // 학교구분
            { label: 'LABEL_00285', field: 'Begda', type: Validator.INPUT1 }, // 입학일
            { label: 'LABEL_00286', field: 'Endda', type: Validator.INPUT1 }, // 졸업일
            { label: 'LABEL_00287', field: 'Sland', type: Validator.INPUT2 }, // 국가
            { label: 'LABEL_00288', field: 'Zzschcd', type: Validator.INPUT2 }, // 학교
            { label: 'LABEL_00289', field: 'Zzmajo1', type: Validator.INPUT1 }, // 전공
            { label: 'LABEL_00290', field: 'Slabs', type: Validator.SELECT2 }, // 학위
            { label: 'LABEL_00293', field: 'Zzentba', type: Validator.SELECT2 }, // 입사전/후
            { label: 'LABEL_00339', field: 'Zznwtns', type: Validator.SELECT1 }, // 신입/편입
            { label: 'LABEL_00340', field: 'Zzdyngt', type: Validator.SELECT1 }, // 주간/야간
            { label: 'LABEL_00248', field: 'Appno', type: Validator.FILE }, // 첨부파일
          ],
        },
        LANGUAGE: {
          key: '9002',
          label: 'LABEL_00305',
          path: 'language',
          odata: 'LanguageTestChange',
          pk: ['Seqnr', 'Seqnr2', 'Begda', 'Endda', 'Prcty'],
          valid: [
            { label: 'LABEL_00306', field: 'Quali', type: Validator.SELECT1 }, // 외국어구분
            { label: 'LABEL_00307', field: 'Exmty', type: Validator.SELECT1 }, // 시험구분
            { label: 'LABEL_00308', field: 'Appor', type: Validator.INPUT1 }, // 평가기관
            { label: 'LABEL_00310', field: 'Eamdt', type: Validator.INPUT1 }, // 평가일
            { label: 'LABEL_00248', field: 'Appno', type: Validator.FILE }, // 첨부파일
          ],
        },
        CERTIFICATE: {
          key: '9006',
          label: 'LABEL_00317',
          path: 'certificate',
          odata: 'CertificateChange',
          pk: ['Seqnr', 'Seqnr2', 'Begda', 'Endda', 'Prcty'],
          valid: [
            { label: 'LABEL_00318', field: 'Cttyp', type: Validator.INPUT1 }, // 자격증
            { label: 'LABEL_00309', field: 'Ctgrd', type: Validator.INPUT1 }, // 등급
            { label: 'LABEL_00319', field: 'Ctnum', type: Validator.INPUT2 }, // 자격증번호
            { label: 'LABEL_00320', field: 'Isaut', type: Validator.INPUT1 }, // 발급기관
            { label: 'LABEL_00321', field: 'Regdt', type: Validator.INPUT1 }, // 등록일
            { label: 'LABEL_00248', field: 'Appno', type: Validator.FILE }, // 첨부파일
          ],
        },
      },
      SELECT_DIALOG: {
        COUNTRY: { path: 'countryList', codeKey: 'Sland', valueKey: 'Landx50', fragmentName: 'CountryDialog' },
        SCHOOL: { path: 'schoolList', codeKey: 'Zzschcd', valueKey: 'Zzschtx', fragmentName: 'SchoolDialog' },
        MAJOR: { path: 'majorList', codeKey: 'Zzmajo1', valueKey: 'Zzmajo1tx', fragmentName: 'MajorDialog' },
        CERTIFICATE: { path: 'certificateList', codeKey: 'Cttyp', valueKey: 'Cttyptx', fragmentName: 'CertificateDialog' },
        CERTIFICATE_GRADE: { path: 'certificateGradeList', codeKey: 'Ctgrd', valueKey: 'Ctgrdtx', fragmentName: 'CertificateGradeDialog' },
      },
      ICONS: {
        FILE1: 'sap-icon://attachment',
        FILE2: 'sap-icon://attachment',
        RESOL: 'sap-icon://comment',
      },

      initializeModel() {
        return {
          busy: false,
          werks: null,
          pernr: null,
          orgtx: null,
          orgeh: null,
          activeReg: false,
          showPDFButton: false,
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
              profilePath: this.getUnknownAvatarImageURL(),
              baseInfo: [],
              timeline: null,
            },
            tab: {
              list: [],
            },
            sub: {},
            dialog: {
              activeButton: false,
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
              techtyList: new ComboEntry({ codeKey: 'Techty', valueKey: 'Techtytx' }),
              techgdList: new ComboEntry({ codeKey: 'Techgd', valueKey: 'Techgdtx' }),
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

        // MSS/HASS process
        if (_.isEqual(sRoute, 'm/employee') || _.isEqual(sRoute, 'h/employee')) {
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

        // ESS 사번으로만 접근시 사이드 리스트 HIDE
        if (this.isHass()) {
          oViewModel.setProperty('/activeReg', true);
        } else if (this.isMss()) {
          oViewModel.setProperty('/activeReg', false);
        } else if (_.isEmpty(oParameter.orgtx) && _.isEmpty(oParameter.orgeh)) {
          oViewModel.setProperty('/activeReg', _.isEmpty(oParameter.pernr));
          oViewModel.setProperty('/werks', mSessionData.Werks);

          this.toggleSideContainer(false);

          this.loadProfile({ oViewModel, sPernr });
          return;
        } else {
          oViewModel.setProperty('/activeReg', false);
        }

        this.toggleSideContainer(true);

        if (!_.isEmpty(sOrgtx)) {
          oViewModel.setProperty('/sideNavigation/search/searchText', sOrgtx);
        }

        this.initialList({ oViewModel, sPernr, sOrgtx, sOrgeh });
        if (!_.isEqual(sPernr, 'NA')) this.loadProfile({ oViewModel, sPernr });
      },

      toggleSideContainer(bToggled) {
        this.byId('sideBody').setVisible(bToggled);
        this.byId('profileBody').toggleStyleClass('expanded', !bToggled);
      },

      async initialList({ oViewModel, sPernr, sOrgtx, sOrgeh }) {
        try {
          // const oSideBody = this.byId('sideBody');
          const oSideList = this.byId('sideEmployeeList');
          const sSearchText = _.isEmpty(sOrgtx) ? sPernr : sOrgtx;
          const sSearchOrgeh = _.isEmpty(sOrgeh) ? _.noop() : sOrgeh;
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Menid: this.getCurrentMenuId(),
            Zflag: 'X',
            Actda: moment().hour(9).toDate(),
            Ename: sSearchText,
            Orgeh: sSearchOrgeh,
          });

          oSideList.getBinding('items').filter([new Filter('Stat2', FilterOperator.EQ, '3')]);

          // const iSideViewHeight = Math.floor($(document).height() - oSideBody.getParent().$().offset().top - 21);
          // const iScrollViewHeight = Math.floor($(document).height() - oSideList.getParent().$().offset().top - 36);
          const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();

          oViewModel.setProperty(
            '/sideNavigation/search/results',
            _.map(aSearchResults, (o) => ({ ...o, Photo: _.isEmpty(o.Photo) ? sUnknownAvatarImageURL : o.Photo }))
          );
          // oViewModel.setProperty('/sideNavigation/height', `${iSideViewHeight}px`);
          // oViewModel.setProperty('/sideNavigation/scrollHeight', `${iScrollViewHeight}px`);
          oViewModel.setProperty('/sideNavigation/busy', false);

          if (_.isEqual(sPernr, 'NA')) {
            const sFirstPernr = _.chain(aSearchResults).filter({ Stat2: '3' }).get([0, 'Pernr'], _.noop());
            this.loadProfile({ oViewModel, sPernr: sFirstPernr });
          }
        } catch (oError) {
          this.debug('Controller > Employee > initialList Error', oError);

          AppUtils.handleError(oError);
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
          const Usrty = this.isMss() ? 'M' : this.isHass() ? 'H' : _.noop();
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
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
            aTechtyList,
            aTechgdList,
          ] = await Promise.all([
            fCurriedGetEntitySet('EmpProfileHeaderNew', mFilters),
            fCurriedGetEntitySet('EmpProfileMilestone', mFilters),
            fCurriedGetEntitySet('EmpProfileMenu', { ...mFilters, Usrty: Usrty }),
            fCurriedGetEntitySet('CountryCode'),
            fCurriedGetEntitySet('MajorCode'),
            fCurriedGetEntitySet('CertificateCode'),
            fCurriedGetEntitySet('CertificateGradeCode'),
            fCurriedGetEntitySet('PaCodeList', { Cdnum: 'CM0002', Grcod: '0006' }),
            fCurriedGetEntitySet('CityList', { Pernr: sPernr }),
            fCurriedGetEntitySet('SchoolTypeCode'),
            fCurriedGetEntitySet('LanguageTypeCode'),
            fCurriedGetEntitySet('TestGradeCode'),
            fCurriedGetEntitySet('TechTypeCode'),
            fCurriedGetEntitySet('TechGradeCode'),
          ]);

          // Milestone set
          oViewModel.setProperty('/employee/header/timeline', _.map(aMilestoneReturnData, (o) => ({ ...o, Datum: this.DateUtils.format(o.Datum) })) || _.noop());

          // Dialog Combo entry set
          oViewModel.setProperty('/employee/dialog/countryList', aCountryList);
          oViewModel.setProperty('/employee/dialog/majorList', aMajorList);
          oViewModel.setProperty('/employee/dialog/certificateList', aCertList);
          oViewModel.setProperty('/employee/dialog/certificateGradeList', aCertGradeList);
          oViewModel.setProperty('/employee/dialog/typeList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aAddressTypeData }));
          oViewModel.setProperty('/employee/dialog/sidoList', new ComboEntry({ codeKey: 'State', valueKey: 'Bezei', aEntries: aAddressCityData }));
          oViewModel.setProperty('/employee/dialog/schoolTypeList', new ComboEntry({ codeKey: 'Slart', valueKey: 'Stext', aEntries: aSchoolTypeList }));
          oViewModel.setProperty('/employee/dialog/languageTypeList', new ComboEntry({ codeKey: 'Quali', valueKey: 'Qualitx', aEntries: aLanguageTypeList }));
          oViewModel.setProperty('/employee/dialog/gradeList', new ComboEntry({ codeKey: 'Eamgr', valueKey: 'Eamgrtx', aEntries: aTestGradeList }));
          oViewModel.setProperty('/employee/dialog/techtyList', new ComboEntry({ codeKey: 'Techty', valueKey: 'Techtytx', aEntries: aTechtyList }));
          oViewModel.setProperty('/employee/dialog/techgdList', new ComboEntry({ codeKey: 'Techgd', valueKey: 'Techgdtx', aEntries: aTechgdList }));
          //End Dialog Combo entry set

          // 상단 프로필 Set
          const { Pturl, Actty, ...oReturnData } = aProfileReturnData[0];
          const aTextFields = ['Dat03', 'Dat05', 'Dat08', 'Dat10', 'Dat13', 'Dat15', 'Dat18', 'Dat20', 'Dat23', 'Dat25'];
          const aConvertData = _.chain(oReturnData)
            .pickBy((v, p) => _.startsWith(p, 'Dat'))
            .map((v, k) => ({ data: v, labelOrText: _.includes(aTextFields, k) ? 'text' : 'label' }))
            .value();

          oViewModel.setProperty('/showPDFButton', _.isEqual(Actty, 'X'));
          oViewModel.setProperty('/employee/header/profilePath', _.isEmpty(Pturl) ? this.getUnknownAvatarImageURL() : Pturl);
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
          oViewModel.setProperty('/employee/sub', {});

          aTabMenus.forEach((data) => {
            this.debug(`Tab ${data.Menu1}`, data);

            _.set(oViewModelData, ['employee', 'sub', data.Menuc1], { contents: {} });

            aHeaderRequests.push(fCurriedGetEntitySet('EmpProfileHeaderTab', { Menuc: data.Menuc1, ...mFilters, Usrty }));
            aContentRequests.push(fCurriedGetEntitySet('EmpProfileContentsTab', { Menuc: data.Menuc1, ...mFilters, Usrty }));
          });

          const bActiveReg = oViewModel.getProperty('/activeReg');
          aSubMenus.forEach((data) => {
            _.set(oViewModelData, ['employee', 'sub', data.Menuc1, 'contents', data.Menuc2], {
              type: data.Child,
              rowCount: 1,
              selectionMode: bActiveReg && _.some(this.CRUD_TABLES, (o) => o.key === data.Menuc2) ? 'MultiToggle' : 'None',
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
                _.times(mSubMenu.header.length, (d) => mSubMenu.data.push(o[`Value${_.padStart(++d, 2, '0')}`]));
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
          AppUtils.setAppBusy(false).setMenuBusy(false);
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
           *      - 주소|학력|자격|어학 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(aSubMenuContents).forEach((key) => {
            const mMenu = _.get(aSubMenuContents, key);
            const oSubVBox = new sap.m.VBox().addStyleClass('customBox sapUiMediumMarginBottom');
            const oSubHBox = new sap.m.HBox({ justifyContent: 'SpaceBetween' }).addStyleClass('table-toolbar');

            this.debug(`Sub ${mMenu.title}`, mMenu);

            // Title
            oSubHBox.addItem(new sap.m.Title({ level: 'H2', text: mMenu.title }));

            // CRUD Buttons
            const bActiveReg = oViewModel.getProperty('/activeReg');
            if (bActiveReg && _.some(this.CRUD_TABLES, (o) => o.key === mMenu.code)) {
              const oSubButtonBox = new sap.m.HBox({
                items: [
                  new sap.m.Button({
                    icon: 'sap-icon://add',
                    text: this.getBundleText('LABEL_00106'), // 등록
                    customData: [new sap.ui.core.CustomData({ key: 'code', value: mMenu.code })],
                    press: this.onPressRegTable.bind(this),
                  }).addStyleClass('icon-button'),
                  new sap.m.Button({
                    icon: 'sap-icon://edit',
                    text: this.getBundleText('LABEL_00108'), // 수정
                    customData: [new sap.ui.core.CustomData({ key: 'code', value: mMenu.code })],
                    enabled: '{= !!${/employee/sub/' + menuKey + '/contents/' + mMenu.code + '/data}.length }',
                    press: this.onPressModifyTable.bind(this),
                  }).addStyleClass('icon-button'),
                  new sap.m.Button({
                    icon: 'sap-icon://less',
                    text: this.getBundleText('LABEL_00110'), // 삭제
                    customData: [new sap.ui.core.CustomData({ key: 'code', value: mMenu.code })],
                    enabled: '{= !!${/employee/sub/' + menuKey + '/contents/' + mMenu.code + '/data}.length }',
                    press: this.onPressDeleteTable.bind(this),
                  }).addStyleClass('icon-button'),
                  new sap.m.Button({
                    icon: 'sap-icon://cancel',
                    text: this.getBundleText('LABEL_00122'), // 신청취소
                    customData: [new sap.ui.core.CustomData({ key: 'code', value: mMenu.code })],
                    enabled: '{= !!${/employee/sub/' + menuKey + '/contents/' + mMenu.code + '/data}.length }',
                    visible: !_.isEqual(mMenu.code, this.CRUD_TABLES.ADDRESS.key),
                    press: this.onPressCancelTable.bind(this),
                  }).addStyleClass('icon-button'),
                ],
              }).addStyleClass('table-actions');

              oSubHBox.addItem(oSubButtonBox);
            }

            oSubVBox.addItem(oSubHBox);

            /**
             * Build Contents
             *  1. Table - 5
             *  2. Grid - 6
             */
            if (mMenu.type === this.SUB_TYPE.TABLE) {
              const sTableDataPath = `/employee/sub/${menuKey}/contents/${key}`;
              const aVisibleHeaders = _.filter(mMenu.header, { Invisible: false });
              const oTable = new Table({
                width: '100%',
                columnHeaderHeight: 45,
                rowHeight: 44,
                enableSelectAll: false,
                selectionMode: { path: `${sTableDataPath}/selectionMode` },
                visibleRowCount: { path: `${sTableDataPath}/rowCount` },
                noData: this.getBundleText('MSG_00001'),
              }).bindRows(`${sTableDataPath}/data`);

              // 인재육성위원회 row click
              if (menuKey === 'M020') {
                oTable.attachCellClick((oEvent) => {
                  const mRowData = oEvent.getParameter('rowBindingContext').getProperty();
                  this.openTalentDevDialog(mRowData);
                });
              }

              aVisibleHeaders.forEach((head, index) => {
                const oColumn = new sap.ui.table.Column({
                  width: _.isEqual(head.Width, '000') ? 'auto' : `${_.toNumber(head.Width)}%`,
                  label: new sap.m.Label({ text: head.Header }),
                });

                const sValueFieldName = `Value${_.padStart(index + 1, 2, 0)}`;
                let oColumnTemplate;
                if (menuKey === 'M020' && ['FILE1', 'FILE2', 'RESOL'].includes(head.Fieldname)) {
                  // 인재육성위원회 icon column
                  oColumnTemplate = new sap.ui.core.Icon({
                    src: this.ICONS[head.Fieldname],
                    visible: head.Fieldname === 'RESOL' ? `{= \${${sValueFieldName}} === "X" }` : `{= Number(\${${sValueFieldName}}) > 0 }`,
                  });
                  if (head.Fieldname !== 'RESOL') {
                    oColumnTemplate
                      .addCustomData(new CustomData({ key: 'appno', value: `{${sValueFieldName}}` })) //
                      .attachPress(this.onPressTalentDevFileIcon.bind(this));
                  }
                  oColumn.setHAlign(sap.ui.core.HorizontalAlign.Center);
                } else {
                  oColumnTemplate = new sap.m.Text({
                    width: '100%', //
                    textAlign: _.isEmpty(head.Align) ? 'Center' : head.Align,
                    text: { path: sValueFieldName },
                  });
                }

                oTable.addColumn(oColumn.setTemplate(oColumnTemplate));
              });

              oSubVBox.addItem(oTable);
            } else if (mMenu.type === this.SUB_TYPE.GRID) {
              const oCSSGrid = new CSSGrid({ gridTemplateColumns: '1fr 3fr 1fr 3fr', gridGap: '1px 0px' }).addStyleClass('form-grid');

              mMenu.header.forEach((head, index) => {
                oCSSGrid.addItem(new sap.m.Label({ text: head.Header })).addItem(new sap.m.Input({ value: mMenu.data[index], editable: false }));
              });

              if (mMenu.header.length % 2 === 1) {
                oCSSGrid.addItem(new sap.m.Label({ text: '' })).addItem(new sap.m.Input({ value: '', editable: false }));
              }

              oSubVBox.addItem(oCSSGrid);
            }

            oWrapperVBox.addItem(oSubVBox);
          });

          oTabContainer.addContent(oWrapperVBox);
        });
      },

      openInputFormDialog() {
        const oView = this.getView();

        AppUtils.setAppBusy(true);

        setTimeout(async () => {
          if (!this._pInputFormDialog) {
            this._pInputFormDialog = await Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.employee.fragment.InputFormDialog',
              controller: this,
            });

            oView.addDependent(this._pInputFormDialog);
          }

          this._pInputFormDialog.open();
          AppUtils.setAppBusy(false);
        }, 100);
      },

      async openSelectDialog({ path, codeKey, valueKey, fragmentName }) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const aItems = oViewModel.getProperty(`/employee/dialog/${path}`);
        const sInputCode = oViewModel.getProperty(`/employee/dialog/form/${codeKey}`);
        let oSelectDialog = this[`_p${fragmentName}`];

        AppUtils.setAppBusy(true);

        if (!oSelectDialog) {
          oSelectDialog = await Fragment.load({
            id: oView.getId(),
            name: `sap.ui.yesco.mvc.view.employee.fragment.form.${fragmentName}`,
            controller: this,
          });

          oView.addDependent(oSelectDialog);
        }

        if (sInputCode) oSelectDialog.getBinding('items').filter(new Filter(codeKey, FilterOperator.EQ, sInputCode));

        oViewModel.setProperty('/employee/dialog/selectedHelpDialog', { codeKey, valueKey });
        oViewModel.setProperty(
          `/employee/dialog/${path}`,
          aItems.map((o) => ({
            ...o,
            selected: o[codeKey] === sInputCode,
          }))
        );

        oSelectDialog.open();
        AppUtils.setAppBusy(false);
      },

      openTalentDevDialog({ Pernr, Value01, Value06 }) {
        const oView = this.getView();

        AppUtils.setAppBusy(true);

        setTimeout(async () => {
          if (!this._pTalentDevDialog) {
            this._pTalentDevDialog = await Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.employee.fragment.TalentDevDialog',
              controller: this,
            });

            const oTalentDevDialogModel = new JSONModel({});
            this.setViewModel(oTalentDevDialogModel, 'talentDev');

            this._pTalentDevDialog //
              .setModel(oTalentDevDialogModel)
              .bindElement('/')
              .attachAfterClose(() => {
                setTimeout(() => {
                  this.getViewModel('talentDev').setProperty('/', null);
                });
              });

            oView.addDependent(this._pTalentDevDialog);
          }

          setTimeout(async () => {
            const oModel = this.getModel(ServiceNames.TALENT);
            const mFilters = { Pernr, Gjahr: Value01, Mdate: moment(Value06).hour(9).toDate() };
            const aTalentDevData = await Client.getEntitySet(oModel, 'TalentDevDetail', mFilters);
            this.getViewModel('talentDev').setProperty('/', aTalentDevData[0]);
            AppUtils.setAppBusy(false);
          });

          this._pTalentDevDialog.open();
        }, 100);
      },

      async refreshTableContents({ oViewModel, sMenuKey }) {
        try {
          const mMenuInfo = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menuc2: sMenuKey });
          const sSubTablePath = `/employee/sub/${mMenuInfo.Menuc1}/contents/${mMenuInfo.Menuc2}`;
          const mFilters = { Pernr: mMenuInfo.Pernr, Menuc: mMenuInfo.Menuc1 };
          const aReturnContents = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'EmpProfileContentsTab', mFilters);
          const aTableData = _.filter(aReturnContents, { Menuc: mMenuInfo.Menuc2 });

          oViewModel.setProperty(`${sSubTablePath}/data`, aTableData);
          oViewModel.setProperty(`${sSubTablePath}/rowCount`, aTableData.length);
        } catch (oError) {
          this.debug('Controller > Employee > refreshTableContents Error', oError);

          throw oError;
        }
      },

      getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields }) {
        const sRowPath = oTable.getRows()[aSelectedIndices[0]].getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(sRowPath);
        const mMenu = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menuc2: oRowData.Menuc });
        const aHeaderData = _.filter(oViewModel.getProperty(`/employee/sub/${mMenu.Menuc1}/contents/${mMenu.Menuc2}/header`), _.size);
        const mFieldSet = aFields.reduce((acc, cur) => {
          acc[cur] = oRowData[`Value${_.padStart(_.findIndex(aHeaderData, { Fieldname: _.chain(cur).upperCase().replace(/ /g, '').value() }) + 1, 2, '0')}`];
          return acc;
        }, {});

        return {
          Pernr: oRowData.Pernr,
          ...mFieldSet,
        };
      },

      transformTreeData({ aTreeData, sRootId }) {
        const sImageURL = this.getImageURL('icon_employee.svg');
        const aConvertedTreeData = _.map(aTreeData, (o) =>
          _.chain(o)
            .omit(['Datum', '__metadata'])
            .set('ref', o.Otype === 'O' ? _.noop() : o.Xchif === 'X' ? sImageURL : sImageURL)
            .value()
        );

        const mGroupedByParents = _.groupBy(aConvertedTreeData, 'ObjidUp');
        const mCatsById = _.keyBy(aConvertedTreeData, 'Objid');

        _.each(_.omit(mGroupedByParents, sRootId), (children, parentId) => (mCatsById[parentId].nodes = children));

        return mGroupedByParents[sRootId];
      },

      async uploadInputFormFiles(sMenuKey) {
        const oViewModel = this.getViewModel();
        const oOriginFiles = oViewModel.getProperty('/employee/dialog/file/originFile');
        const oFiles = oViewModel.getProperty('/employee/dialog/file/newFile');
        let sAppno = oViewModel.getProperty('/employee/dialog/form/Appno');

        if (!oFiles.length) return sAppno;

        try {
          if (!sAppno) sAppno = await Appno.get();

          if (!_.isEmpty(oOriginFiles)) await this.AttachFileAction.deleteFile(sAppno, sMenuKey, oOriginFiles[0].Seqnr);

          await this.AttachFileAction.upload.call(this, sAppno, sMenuKey, oFiles);
        } catch (oError) {
          this.debug('Controller > Employee > uploadInputFormFiles Error', oError);

          throw oError;
        }

        return sAppno;
      },

      /* =========================================================== */
      /* ! event handlers                                              */
      /* =========================================================== */
      onToggleNavigation(oEvent) {
        const oViewModel = this.getViewModel();
        const oSideBody = this.byId('sideBody');
        const oProfileBody = this.byId('profileBody');
        const bPressed = oEvent.getParameter('pressed');

        oSideBody.toggleStyleClass('expanded', !bPressed);
        oProfileBody.toggleStyleClass('expanded', bPressed);

        setTimeout(() => oViewModel.setProperty('/sideNavigation/isShow', !bPressed), bPressed ? 100 : 200);
      },

      async onSelectSideTab(oEvent) {
        const oViewModel = this.getView().getModel();

        try {
          const sSelectedKey = oEvent.getParameter('key');
          const bTreeLoaded = oViewModel.getProperty('/sideNavigation/treeLoaded');

          if (!bTreeLoaded && sSelectedKey === 'tree') {
            // const oSideTree = this.byId('OrganizationTree');
            const aReturnTreeData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'AuthOrgTree', { Datum: moment().hour(9).toDate(), Xpern: 'X' });
            const mConvertedTreeData = this.transformTreeData({ aTreeData: aReturnTreeData, sRootId: '00000000' });
            // const iTreeViewHeight = Math.max(Math.floor($(document).height() - oSideTree.$().offset().top - 35), 500);

            this.debug('mConvertedTreeData', mConvertedTreeData);

            oViewModel.setProperty('/sideNavigation/treeData', mConvertedTreeData);
            // oViewModel.setProperty('/sideNavigation/treeHeight', `${iTreeViewHeight}px`);
          }

          oViewModel.setProperty('/sideNavigation/treeLoaded', true);
        } catch (oError) {
          this.debug('Controller > Employee > onSelectSideTab Error', oError);

          AppUtils.handleError(oError);
        }
      },

      async onChangeStat() {
        const oViewModel = this.getView().getModel();
        const oSideList = this.byId('sideEmployeeList');
        const sStat = oViewModel.getProperty('/sideNavigation/search/selectedState');
        const oStatFilter = new Filter('Stat2', FilterOperator.EQ, sStat);

        oSideList.getBinding('items').filter(!sStat ? [] : [oStatFilter]);
      },

      async onPressEmployeeSearch(oEvent) {
        const oViewModel = this.getView().getModel();
        const oControl = oEvent.getSource();
        const sSearchText = oControl.getValue();

        if (!sSearchText) {
          // MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_00201')); // {검색어}를 입력하세요.
          return;
        } else if (sSearchText.length < 2) {
          MessageBox.alert(this.getBundleText('MSG_00026')); // 성명은 2자 이상이어야 합니다.
          return;
        }

        try {
          const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Menid: this.getCurrentMenuId(),
            Zflag: 'X',
            Actda: moment().hour(9).toDate(),
            Ename: sSearchText,
          });

          oViewModel.setProperty(
            '/sideNavigation/search/results',
            _.map(aSearchResults, (o) => ({ ...o, Photo: _.isEmpty(o.Photo) ? sUnknownAvatarImageURL : o.Photo }))
          );
        } catch (oError) {
          this.debug('Controller > Employee > onPressEmployeeSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onClickEmployeeCard(oEvent) {
        const sPath = oEvent.getSource().getBindingContext().getPath();
        const oViewModel = this.getView().getModel();
        const sPrevPernr = oViewModel.getProperty('/pernr');
        const sPernr = oViewModel.getProperty(`${sPath}/Pernr`);
        const sLeadTabKey = oViewModel.getProperty('/employee/tab/list/0/Menuc1');

        if (!sPernr) {
          MessageBox.error(this.getBundleText('MSG_00035')); // 대상자 사번이 없습니다.
          return;
        } else if (sPrevPernr === sPernr) {
          return;
        }

        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/pernr', sPernr);
        oViewModel.setProperty('/employee/tab/selectedKey', sLeadTabKey);

        this.loadProfile({ oViewModel, sPernr });
      },

      onSelectTreeItem(oEvent) {
        const oViewModel = this.getView().getModel();
        const oSelectContext = oEvent.getParameter('listItem').getBindingContext();
        const mSelectedItem = oSelectContext.getProperty();
        const sPernr = mSelectedItem.Objid;
        const sLeadTabKey = oViewModel.getProperty('/employee/tab/list/0/Menuc1');

        this.debug('mSelectedItem', mSelectedItem);

        if (mSelectedItem.Otype === 'P') {
          oViewModel.setProperty('/employee/busy', true);
          oViewModel.setProperty('/pernr', sPernr);
          oViewModel.setProperty('/employee/tab/selectedKey', sLeadTabKey);

          this.loadProfile({ oViewModel, sPernr });
        }
      },

      onPressRegTable(oEvent) {
        const oViewModel = this.getView().getModel();
        const sSelectedMenuCode = oEvent.getSource().data('code');
        const sMenuKey = _.lowerCase(_.findKey(this.CRUD_TABLES, { key: sSelectedMenuCode }));
        const sLabel = this.getBundleText(this.CRUD_TABLES[_.upperCase(sMenuKey)].label);
        const sDefaultSelectedKey = 'ALL';

        oViewModel.setProperty('/employee/dialog/subKey', sSelectedMenuCode);
        oViewModel.setProperty('/employee/dialog/subLabel', sLabel);
        oViewModel.setProperty('/employee/dialog/action', 'A');
        oViewModel.setProperty('/employee/dialog/actionText', this.getBundleText('LABEL_00106')); // 등록
        oViewModel.setProperty('/employee/dialog/file/originFile', []);
        oViewModel.setProperty('/employee/dialog/file/newFile', []);

        switch (sMenuKey) {
          case this.CRUD_TABLES.ADDRESS.path:
            oViewModel.setProperty('/employee/dialog/form', { Subty: sDefaultSelectedKey, State: sDefaultSelectedKey });

            break;
          case this.CRUD_TABLES.EDUCATION.path:
            const mCountryList = oViewModel.getProperty('/employee/dialog/countryList');
            const mKoreaObject = _.find(mCountryList, { Sland: 'KR' });

            oViewModel.setProperty('/employee/dialog/form', {
              Slart: sDefaultSelectedKey,
              Sland: mKoreaObject.Sland,
              Landx50: mKoreaObject.Landx50,
              Slabs: sDefaultSelectedKey,
              Zzentba: sDefaultSelectedKey,
              Zznwtns: sDefaultSelectedKey,
              Zzdyngt: sDefaultSelectedKey,
            });

            break;
          case this.CRUD_TABLES.LANGUAGE.path:
            oViewModel.setProperty('/employee/dialog/form', { Quali: sDefaultSelectedKey, Exmty: sDefaultSelectedKey, Eamgr: sDefaultSelectedKey });
            break;
          case this.CRUD_TABLES.CERTIFICATE.path:
            oViewModel.setProperty('/employee/dialog/form', { Techty: sDefaultSelectedKey, Techgd: sDefaultSelectedKey });
            break;
          default:
            break;
        }

        oViewModel.setProperty('/employee/dialog/activeButton', true);
        this.openInputFormDialog();
      },

      async onSaveInputForm() {
        const oViewModel = this.getView().getModel();

        oViewModel.setProperty('/employee/dialog/activeButton', false);

        try {
          AppUtils.setAppBusy(true);

          const mFieldValue = oViewModel.getProperty('/employee/dialog/form');
          const sAction = oViewModel.getProperty('/employee/dialog/action');
          const sMenuKey = oViewModel.getProperty('/employee/dialog/subKey');
          const sPrcty = sAction === 'A' ? 'C' : 'U';
          let sActionText = oViewModel.getProperty('/employee/dialog/actionText');
          let mInputData = {};
          let aFieldProperties = [];
          let sOdataEntity = '';
          let sAppno = '';

          switch (sMenuKey) {
            case this.CRUD_TABLES.ADDRESS.key:
              sOdataEntity = this.CRUD_TABLES.ADDRESS.odata;
              aFieldProperties = this.CRUD_TABLES.ADDRESS.valid;

              const oSido = _.find(oViewModel.getProperty('/employee/dialog/sidoList'), { State: mFieldValue.State });
              mInputData = {
                ...oSido,
                ...mFieldValue,
                Begda: mFieldValue.Begda ? this.DateUtils.parse(mFieldValue.Begda) : mFieldValue.Begda,
              };

              break;
            case this.CRUD_TABLES.EDUCATION.key:
              sOdataEntity = this.CRUD_TABLES.EDUCATION.odata;
              aFieldProperties = _.includes(['S1', 'S2', 'S3'], mFieldValue.Slart) ? _.reject(this.CRUD_TABLES.EDUCATION.valid, { field: 'Zzmajo1' }) : this.CRUD_TABLES.EDUCATION.valid;
              sAppno = await this.uploadInputFormFiles(this.CRUD_TABLES.EDUCATION.key);
              sActionText = `${sActionText}${this.getBundleText('LABEL_00121')}`; // 신청

              if (_.includes(['S1', 'S2', 'S3'], mFieldValue.Slart)) {
                delete mFieldValue.Zzmajo1;
                delete mFieldValue.Zzmajo1tx;

                aFieldProperties = _.reject(this.CRUD_TABLES.EDUCATION.valid, { field: 'Zzmajo1' });
              } else {
                aFieldProperties = this.CRUD_TABLES.EDUCATION.valid;
              }

              mInputData = {
                ...mFieldValue,
                Prcty: sPrcty,
                Appno: sAppno,
                Begda: mFieldValue.Begda ? this.DateUtils.parse(mFieldValue.Begda) : mFieldValue.Begda,
                Endda: mFieldValue.Endda ? this.DateUtils.parse(mFieldValue.Endda) : mFieldValue.Endda,
              };

              break;
            case this.CRUD_TABLES.LANGUAGE.key:
              sOdataEntity = this.CRUD_TABLES.LANGUAGE.odata;
              aFieldProperties = this.CRUD_TABLES.LANGUAGE.valid;
              sAppno = await this.uploadInputFormFiles(this.CRUD_TABLES.LANGUAGE.key);
              sActionText = `${sActionText}${this.getBundleText('LABEL_00121')}`; // 신청

              // 등급/점수 Validation(Eamgr, Tpont)
              if (mFieldValue.Eamgr === 'ALL' && (_.isEmpty(mFieldValue.Tpont) || _.toNumber(mFieldValue.Tpont) === 0)) {
                throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00003', 'LABEL_00341') }); // {등급 또는 점수}를 입력하세요.
              }

              mInputData = {
                ...mFieldValue,
                Prcty: sPrcty,
                Appno: sAppno,
                Eamdt: mFieldValue.Eamdt ? this.DateUtils.parse(mFieldValue.Eamdt) : mFieldValue.Eamdt,
              };

              if (sPrcty === 'C') {
                _.chain(mInputData)
                  .set('Begda', mFieldValue.Eamdt ? this.DateUtils.parse(mFieldValue.Eamdt) : _.noop())
                  .set('Endda', mFieldValue.Eamdt ? this.DateUtils.parse(mFieldValue.Eamdt) : _.noop())
                  .commit();
              } else {
                _.chain(mInputData)
                  .set('Begda', mFieldValue.Begda ? this.DateUtils.parse(mFieldValue.Begda) : _.noop())
                  .set('Endda', mFieldValue.Endda ? this.DateUtils.parse(mFieldValue.Endda) : _.noop())
                  .commit();
              }

              break;
            case this.CRUD_TABLES.CERTIFICATE.key:
              sOdataEntity = this.CRUD_TABLES.CERTIFICATE.odata;
              aFieldProperties = this.CRUD_TABLES.CERTIFICATE.valid;
              sAppno = await this.uploadInputFormFiles(this.CRUD_TABLES.CERTIFICATE.key);
              sActionText = `${sActionText}${this.getBundleText('LABEL_00121')}`; // 신청

              if (!_.isEmpty(mFieldValue.Zbigo)) _.remove(aFieldProperties, { field: 'Appno' });

              mInputData = {
                ...mFieldValue,
                Prcty: sPrcty,
                Appno: sAppno,
                Regdt: mFieldValue.Regdt ? this.DateUtils.parse(mFieldValue.Regdt) : mFieldValue.Regdt,
              };

              if (sPrcty === 'C') {
                _.chain(mInputData)
                  .set('Begda', mFieldValue.Regdt ? this.DateUtils.parse(mFieldValue.Regdt) : _.noop())
                  .set('Endda', mFieldValue.Regdt ? this.DateUtils.parse(mFieldValue.Regdt) : _.noop())
                  .commit();
              } else {
                _.chain(mInputData)
                  .set('Begda', mFieldValue.Begda ? this.DateUtils.parse(mFieldValue.Begda) : _.noop())
                  .set('Endda', mFieldValue.Endda ? this.DateUtils.parse(mFieldValue.Endda) : _.noop())
                  .commit();
              }

              break;
            default:
              break;
          }

          if (this.isHass()) _.set(mInputData, 'Pernr', oViewModel.getProperty('/pernr'));

          if (!Validator.check({ mFieldValue: mInputData, aFieldProperties })) {
            oViewModel.setProperty('/employee/dialog/activeButton', true);
            return;
          }

          MessageBox.confirm(this.getBundleText('MSG_00006', sActionText), {
            actions: [oViewModel.getProperty('/employee/dialog/actionText'), MessageBox.Action.CANCEL],
            onClose: async (sAction) => {
              if (!sAction || sAction === MessageBox.Action.CANCEL) {
                oViewModel.setProperty('/employee/dialog/activeButton', true);
                return;
              }

              await Client.create(this.getModel(ServiceNames.PA), sOdataEntity, mInputData);

              // {등록|수정}되었습니다.
              MessageBox.success(this.getBundleText('MSG_00007', sActionText), {
                onClose: () => {
                  oViewModel.setProperty('/employee/dialog/activeButton', true);
                  this.refreshTableContents({ oViewModel, sMenuKey });
                  this.onInputFormDialogClose();
                },
              });
            },
          });
        } catch (oError) {
          this.debug('Controller > Employee > onSaveInputForm Error', oError);

          oViewModel.setProperty('/employee/dialog/activeButton', true);
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      async onPressModifyTable(oEvent) {
        const oModel = this.getModel(ServiceNames.PA);
        const oViewModel = this.getView().getModel();
        const oControl = oEvent.getSource();
        const oTable = oControl.getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();
        const sSelectedMenuCode = oControl.data('code');
        const sMenuKey = _.lowerCase(_.findKey(this.CRUD_TABLES, { key: sSelectedMenuCode }));
        const sActionTextCode = !_.isEqual(sSelectedMenuCode, this.CRUD_TABLES.ADDRESS.key) ? 'LABEL_00343' : 'LABEL_00108';

        if (aSelectedIndices.length !== 1) {
          MessageBox.alert(this.getBundleText('MSG_00059', sActionTextCode)); // {0}할 데이터를 한 건만 선택하여 주십시오.
          return;
        }

        try {
          const mTableInfo = this.CRUD_TABLES[_.upperCase(sMenuKey)];
          const aFields = mTableInfo.pk;
          const sOdataEntity = mTableInfo.odata;
          const sLabel = this.getBundleText(mTableInfo.label);
          const mFilters = this.getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields });

          if (!_.isEmpty(mFilters.Prcty)) {
            throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00060') }); // 신청중인 데이터는 중복신청이 불가합니다.
          } else {
            delete mFilters.Prcty;
          }

          oViewModel.setProperty('/employee/dialog/subKey', sSelectedMenuCode);
          oViewModel.setProperty('/employee/dialog/subLabel', sLabel);
          oViewModel.setProperty('/employee/dialog/action', 'U');
          oViewModel.setProperty('/employee/dialog/actionText', this.getBundleText('LABEL_00108'));
          oViewModel.setProperty('/employee/dialog/file/originFile', []);
          oViewModel.setProperty('/employee/dialog/file/newFile', []);

          switch (sMenuKey) {
            case this.CRUD_TABLES.ADDRESS.path:
              mFilters.Begda = this.DateUtils.parse(mFilters.Begda);

              break;
            case this.CRUD_TABLES.EDUCATION.path:
            case this.CRUD_TABLES.LANGUAGE.path:
            case this.CRUD_TABLES.CERTIFICATE.path:
              mFilters.Begda = this.DateUtils.parse(mFilters.Begda);
              mFilters.Endda = this.DateUtils.parse(mFilters.Endda);

              break;
            default:
              break;
          }

          const [mTableRowDetail] = await Client.getEntitySet(oModel, sOdataEntity, mFilters);

          if (_.isEmpty(mTableRowDetail)) throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00034') }); // 조회할 수 없습니다.

          oViewModel.setProperty('/employee/dialog/form', mTableRowDetail);

          // 국가,학위 엔트리 조회
          if (_.has(mTableRowDetail, 'Slart')) {
            const mFilters = { Slart: mTableRowDetail.Slart };
            const [aSchoolList, aDegreeList] = await Promise.all([
              Client.getEntitySet(oModel, 'SchoolCode', mFilters), //
              Client.getEntitySet(oModel, 'DegreeCode', mFilters),
            ]);

            oViewModel.setProperty('/employee/dialog/schoolList', aSchoolList);
            oViewModel.setProperty('/employee/dialog/degreeList', new ComboEntry({ codeKey: 'Slabs', valueKey: 'Stext', aEntries: aDegreeList }));
          } else if (_.has(mTableRowDetail, 'Quali')) {
            // 시험구분 엔트리 조회
            const mFilters = { Quali: mTableRowDetail.Quali };
            const aExamList = await Client.getEntitySet(oModel, 'TestTypeCode', mFilters);

            oViewModel.setProperty('/employee/dialog/examTypeList', new ComboEntry({ codeKey: 'Exmty', valueKey: 'Exmtytx', aEntries: aExamList }));
          }

          // 파일 조회
          if (_.has(mTableRowDetail, 'Appno')) {
            const aFileList = await this.AttachFileAction.readFileList(mTableRowDetail.Appno, sSelectedMenuCode);

            if (!_.isEmpty(aFileList)) {
              oViewModel.setProperty('/employee/dialog/file/originFile', aFileList);
              oViewModel.setProperty('/employee/dialog/form', { ...aFileList[0], ...mTableRowDetail });
            }
          }

          oViewModel.setProperty('/employee/dialog/activeButton', true);
          this.openInputFormDialog(oEvent);
          // oTable.clearSelection();
        } catch (oError) {
          this.debug('Controller > Employee > onPressModifyTable Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressDeleteTable(oEvent) {
        const oViewModel = this.getView().getModel();
        const oControl = oEvent.getSource();
        const oTable = oControl.getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();
        const sSelectedMenuCode = oControl.data('code');
        const sMenuKey = _.lowerCase(_.findKey(this.CRUD_TABLES, { key: sSelectedMenuCode }));
        const sActionTextCode = !_.isEqual(sSelectedMenuCode, this.CRUD_TABLES.ADDRESS.key) ? 'LABEL_00344' : 'LABEL_00110';

        if (aSelectedIndices.length !== 1) {
          MessageBox.alert(this.getBundleText('MSG_00059', sActionTextCode)); // {0}할 데이터를 한 건만 선택하여 주십시오.
          return;
        }

        const mTableInfo = this.CRUD_TABLES[_.upperCase(sMenuKey)];
        const aFields = mTableInfo.pk;
        const sOdataEntity = mTableInfo.odata;
        const mPayload = this.getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields });

        if (!_.isEmpty(mPayload.Prcty)) {
          MessageBox.alert(this.getBundleText('MSG_00060')); // 신청중인 데이터는 중복신청이 불가합니다.
          return;
        }

        AppUtils.setAppBusy(true);

        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', sActionTextCode), {
          actions: [this.getBundleText(sActionTextCode), MessageBox.Action.CANCEL], // 삭제
          onClose: async (sAction) => {
            if (!!sAction && sAction !== MessageBox.Action.CANCEL) {
              try {
                switch (sMenuKey) {
                  case this.CRUD_TABLES.ADDRESS.path:
                    mPayload.Begda = this.DateUtils.parse(mPayload.Begda);

                    break;
                  case this.CRUD_TABLES.EDUCATION.path:
                  case this.CRUD_TABLES.LANGUAGE.path:
                  case this.CRUD_TABLES.CERTIFICATE.path:
                    mPayload.Begda = this.DateUtils.parse(mPayload.Begda);
                    mPayload.Endda = this.DateUtils.parse(mPayload.Endda);

                    break;
                  default:
                    break;
                }

                if (!_.isEqual(sSelectedMenuCode, this.CRUD_TABLES.ADDRESS.key)) {
                  _.chain(mPayload).set('Prcty', 'D').commit();

                  await Client.create(this.getModel(ServiceNames.PA), sOdataEntity, mPayload);
                } else {
                  await Client.remove(this.getModel(ServiceNames.PA), sOdataEntity, mPayload);
                }

                oTable.clearSelection();
                this.refreshTableContents({ oViewModel, sMenuKey: sSelectedMenuCode });

                MessageBox.success(this.getBundleText('MSG_00007', sActionTextCode)); // {삭제}되었습니다.
              } catch (oError) {
                this.debug('Controller > Employee > onPressDeleteTable Error', oError);

                AppUtils.handleError(oError);
              }
            }

            AppUtils.setAppBusy(false);
          },
        });
      },

      onPressCancelTable(oEvent) {
        const oViewModel = this.getView().getModel();
        const oControl = oEvent.getSource();
        const oTable = oControl.getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();
        const sSelectedMenuCode = oControl.data('code');
        const sMenuKey = _.lowerCase(_.findKey(this.CRUD_TABLES, { key: sSelectedMenuCode }));
        const mTableInfo = this.CRUD_TABLES[_.upperCase(sMenuKey)];
        const aFields = mTableInfo.pk;
        const sOdataEntity = mTableInfo.odata;
        let mPayload = {};

        try {
          if (aSelectedIndices.length !== 1) {
            throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00059', 'LABEL_00122') }); // {신청취소}할 데이터를 한 건만 선택하여 주십시오.
          }

          mPayload = this.getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields });

          if (_.isEmpty(mPayload.Prcty)) {
            throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00061') }); // 신청중인 데이터가 아닙니다.
          }
        } catch (oError) {
          AppUtils.handleError(oError);
          return;
        }

        AppUtils.setAppBusy(true);

        // {신청취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00122'), {
          actions: [this.getBundleText('LABEL_00122'), MessageBox.Action.CANCEL], // 삭제
          onClose: async (sAction) => {
            if (!!sAction && sAction !== MessageBox.Action.CANCEL) {
              try {
                switch (sMenuKey) {
                  case this.CRUD_TABLES.EDUCATION.path:
                  case this.CRUD_TABLES.ADDRESS.path:
                  case this.CRUD_TABLES.LANGUAGE.path:
                  case this.CRUD_TABLES.CERTIFICATE.path:
                    mPayload.Begda = this.DateUtils.parse(mPayload.Begda);
                    mPayload.Endda = this.DateUtils.parse(mPayload.Endda);

                    break;
                  default:
                    break;
                }

                delete mPayload.Prcty;

                await Client.remove(this.getModel(ServiceNames.PA), sOdataEntity, mPayload);

                oTable.clearSelection();
                this.refreshTableContents({ oViewModel, sMenuKey: sSelectedMenuCode });

                MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00122')); // {신청취소}되었습니다.
              } catch (oError) {
                this.debug('Controller > Employee > onPressCancelTable Error', oError);

                AppUtils.handleError(oError);
              }
            }

            AppUtils.setAppBusy(false);
          },
        });
      },

      async onChangeSchoolType() {
        const oModel = this.getModel(ServiceNames.PA);
        const oViewModel = this.getViewModel();
        const sSlart = oViewModel.getProperty('/employee/dialog/form/Slart');

        if (sSlart === 'ALL') {
          oViewModel.setProperty('/employee/dialog/form/Slabs', 'ALL');
          oViewModel.setProperty('/employee/dialog/degreeList', new ComboEntry({ codeKey: 'Slabs', valueKey: 'Stext' }));
          oViewModel.setProperty('/employee/dialog/schoolList', []);

          return;
        }

        try {
          oViewModel.setProperty('/employee/dialog/busy/Slabs', true);

          const mFilters = { Slart: sSlart };
          const [aSchoolList, aDegreeList] = await Promise.all([
            Client.getEntitySet(oModel, 'SchoolCode', mFilters), //
            Client.getEntitySet(oModel, 'DegreeCode', mFilters),
          ]);

          oViewModel.setProperty('/employee/dialog/form/Slabs', 'ALL');
          oViewModel.setProperty('/employee/dialog/schoolList', aSchoolList);
          oViewModel.setProperty('/employee/dialog/degreeList', new ComboEntry({ codeKey: 'Slabs', valueKey: 'Stext', aEntries: aDegreeList }));
        } catch (oError) {
          this.debug('Controller > Employee > onChangeSchoolType Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/employee/dialog/busy/Slabs', false);
        }
      },

      async onChangeLanguageType() {
        const oModel = this.getModel(ServiceNames.PA);
        const oViewModel = this.getViewModel();
        const sQuali = oViewModel.getProperty('/employee/dialog/form/Quali');

        if (sQuali === 'ALL') {
          oViewModel.setProperty('/employee/dialog/form/Exmty', 'ALL');
          oViewModel.setProperty('/employee/dialog/examTypeList', new ComboEntry({ codeKey: 'Exmty', valueKey: 'Exmtytx' }));

          return;
        }

        try {
          oViewModel.setProperty('/employee/dialog/busy/Exmty', true);

          const mFilters = { Quali: sQuali };
          const aExamList = await Client.getEntitySet(oModel, 'TestTypeCode', mFilters);

          oViewModel.setProperty('/employee/dialog/form/Exmty', 'ALL');
          oViewModel.setProperty('/employee/dialog/examTypeList', new ComboEntry({ codeKey: 'Exmty', valueKey: 'Exmtytx', aEntries: aExamList }));
        } catch (oError) {
          this.debug('Controller > Employee > onChangeLanguageType Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/employee/dialog/busy/Exmty', false);
        }
      },

      onChangeLanguagePoint(oEvent) {
        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const sPath = oControl.getBinding('value').getPath();
        const mFormData = oViewModel.getProperty('/employee/dialog/form');

        oViewModel.setProperty(sPath, String(Number(oControl.getValue())));
        oViewModel.setProperty('/employee/dialog/form/Tpont', _.chain(mFormData).pick(['Spont', 'Hpont', 'Rpont', 'Wpont']).values().sumBy(_.toNumber).toString().value());
      },

      onPressHelpRequest(oEvent) {
        const sHelpName = oEvent.getSource().data('helpName');

        this.openSelectDialog(this.SELECT_DIALOG[sHelpName]);
      },

      onSearchDialogHelp(oEvent) {
        const mHelpDialogInfo = this.getViewModel().getProperty('/employee/dialog/selectedHelpDialog');

        oEvent.getParameter('itemsBinding').filter([
          new Filter(mHelpDialogInfo.valueKey, FilterOperator.Contains, oEvent.getParameter('value')), //
        ]);
      },

      onCloseDialogHelp(oEvent) {
        const oViewModel = this.getViewModel();
        const oSelectedItem = oEvent.getParameter('selectedItem');
        const mHelpDialogInfo = oViewModel.getProperty('/employee/dialog/selectedHelpDialog');

        oViewModel.setProperty(`/employee/dialog/form/${mHelpDialogInfo.codeKey}`, oSelectedItem.getDescription());
        oViewModel.setProperty(`/employee/dialog/form/${mHelpDialogInfo.valueKey}`, oSelectedItem.getTitle());
      },

      openSearchZipCodePopup() {
        this.PostcodeDialogHandler.openDialog();
      },

      onInputFormDialogClose() {
        AppUtils.setAppBusy(false);
        this.byId('inputFormDialog').close();
      },

      onInputFormFileChange(oEvent) {
        const oViewModel = this.getViewModel();
        const oFileUploader = oEvent.getSource();
        const oFiles = oEvent.getParameter('files');
        const mFormData = oViewModel.getProperty('/employee/dialog/form');

        oViewModel.setProperty('/employee/dialog/file/newFile', [...oFiles]);
        oViewModel.setProperty('/employee/dialog/form', { ...mFormData, Zfilename: oFiles[0].name });

        oFileUploader.clear();
        oFileUploader.setValue('');
      },

      onPressFileLink() {
        const oViewModel = this.getViewModel();
        const sUrl = oViewModel.getProperty('/employee/dialog/form/Fileuri');

        this.AttachFileAction.openFileLink(sUrl);
      },

      async onEmployeePrint() {
        try {
          const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'PerCardPrint', {
            Pernr: this.getViewModel().getProperty('/pernr') || this.getAppointeeProperty('Pernr'),
            Gubun: 'S',
          });

          if (!_.isEmpty(mResult.Url)) window.open(mResult.Url, '_blank');
        } catch (oError) {
          this.debug('Controller > Employee > onEmployeePrint Error', oError);

          AppUtils.handleError(oError);
        }
      },

      callbackPostcode({ sPostcode, sFullAddr }) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/employee/dialog/form/Pstlz', sPostcode);
        oViewModel.setProperty('/employee/dialog/form/Zzaddr1', sFullAddr);
      },

      onTalentDevDialogClose() {
        AppUtils.setAppBusy(false);
        this._pTalentDevDialog.close();
      },

      async onPressTalentDevFileIcon(oEvent) {
        const mFile = await FileDataProvider.readData(oEvent.getSource().data('appno'), 9050);
        this.AttachFileAction.openFileLink(mFile.Fileuri);
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
