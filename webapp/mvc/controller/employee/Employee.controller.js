sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/Table',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataUpdateError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    CSSGrid,
    Filter,
    FilterOperator,
    JSONModel,
    Table,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    ODataCreateError,
    ODataDeleteError,
    ODataReadError,
    ODataUpdateError,
    ServiceNames,
    Validator,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.Employee', {
      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },
      CRUD_TABLES: {
        ADDRESS: {
          key: '0006',
          label: 'LABEL_00283',
          path: 'address',
          url: '/AddressInfoSet',
          pk: ['Subty', 'Begda'],
          valid: [
            { label: 'LABEL_00270', field: 'Subty', type: Validator.SELECT1 }, // 주소유형
            { label: 'LABEL_00271', field: 'Begda', type: Validator.INPUT1 }, // 적용시작일
            { label: 'LABEL_00272', field: 'State', type: Validator.SELECT2 }, // 시/도
            { label: 'LABEL_00273', field: 'Pstlz', type: Validator.INPUT2 }, // 우편번호
            { label: 'LABEL_00274', field: 'Zzaddr2', type: Validator.INPUT2 }, // 상세주소
          ],
        },
        EDUCATION: {
          key: '0022',
          label: 'LABEL_00303',
          path: 'education',
          url: '/EducationChangeSet',
          pk: ['Seqnr', 'Begda', 'Endda', 'Subty'],
          valid: [
            { label: 'LABEL_00284', field: 'Slart', type: Validator.SELECT1 }, // 학교구분
            { label: 'LABEL_00285', field: 'Begda', type: Validator.INPUT1 }, // 입학일
            { label: 'LABEL_00286', field: 'Endda', type: Validator.INPUT1 }, // 졸업일
            { label: 'LABEL_00287', field: 'Sland', type: Validator.INPUT2 }, // 국가
            { label: 'LABEL_00288', field: 'Zzschcd', type: Validator.INPUT2 }, // 학교
            { label: 'LABEL_00289', field: 'Zzmajo1', type: Validator.INPUT1 }, // 전공
            { label: 'LABEL_00290', field: 'Slabs', type: Validator.SELECT2 }, // 학위
            { label: 'LABEL_00248', field: 'Appno', type: Validator.FILE }, // 첨부파일
          ],
        },
        LANGUAGE: {
          key: '9002',
          label: 'LABEL_00305',
          path: 'language',
          url: '/LanguageTestChangeSet',
          pk: ['Seqnr', 'Begda', 'Endda'],
          valid: [
            { label: 'LABEL_00306', field: 'Quali', type: Validator.SELECT1 }, // 외국어구분
            { label: 'LABEL_00307', field: 'Exmty', type: Validator.SELECT1 }, // 시험구분
            { label: 'LABEL_00308', field: 'Appor', type: Validator.INPUT1 }, // 평가기관
            { label: 'LABEL_00309', field: 'Eamgr', type: Validator.SELECT1 }, // 등급
            { label: 'LABEL_00310', field: 'Eamdt', type: Validator.INPUT1 }, // 평가일
            { label: 'LABEL_00311', field: 'Tpont', type: Validator.INPUT2 }, // 종합점수
            { label: 'LABEL_00248', field: 'Appno', type: Validator.FILE }, // 첨부파일
          ],
        },
        CERTIFICATE: {
          key: '9006',
          label: 'LABEL_00317',
          path: 'certificate',
          url: '/CertificateChangeSet',
          pk: ['Seqnr', 'Begda', 'Endda'],
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

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          pernr: null,
          sideNavigation: {
            isShow: true,
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
              profilePath: 'https://i1.wp.com/jejuhydrofarms.com/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png?ssl=1',
              baseInfo: [],
              timeline: [
                { label: '회사입사일', data: '2010.01.01' },
                { label: '부서배치일', data: '2015.01.01' },
                { label: '직급승진일', data: '2016.01.01' },
                { label: '직책임용일', data: '2010.01.01' },
                { label: '10년장기근속일', data: '2019.12.31' },
              ],
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
                mEntries: [
                  { code: 'A', text: this.getBundleText('LABEL_00294') }, // 입사후
                  { code: 'B', text: this.getBundleText('LABEL_00295') }, // 입사전
                ],
              }),
              school2Entry: new ComboEntry({
                mEntries: [
                  { code: 'A', text: this.getBundleText('LABEL_00296') }, // 신입
                  { code: 'B', text: this.getBundleText('LABEL_00297') }, // 편입
                ],
              }),
              school3Entry: new ComboEntry({
                mEntries: [
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
        });
        this.setViewModel(oViewModel);
      },

      onObjectMatched(oParameter) {
        const oViewModel = this.getView().getModel();
        const sPernr = oParameter.pernr || this.getOwnerComponent().getSessionModel().getProperty('/Pernr');

        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.initialList({ oViewModel, sPernr });
        this.loadProfile({ oViewModel, sPernr });
      },

      async initialList({ oViewModel, sPernr }) {
        const oSideBody = this.byId('sideBody');
        const oSideList = this.byId('sideEmployeeList');
        const oStatFilter = new Filter('Stat2', FilterOperator.EQ, '3');
        const oSessionData = this.getOwnerComponent().getSessionModel().getData();
        const oSearchParam = {
          searchText: sPernr || oSessionData.Pernr,
          ...oSessionData,
        };
        const oSearchResults = await this.readEmpSearchResult({ oSearchParam });
        const iSideViewHeight = Math.floor($(document).height() - oSideBody.getParent().$().offset().top - 20);
        const iScrollViewHeight = Math.floor($(document).height() - oSideList.getParent().$().offset().top - 36);

        oViewModel.setProperty('/sideNavigation/search/results', oSearchResults);
        oViewModel.setProperty('/sideNavigation/height', `${iSideViewHeight}px`);
        oViewModel.setProperty('/sideNavigation/scrollHeight', `${iScrollViewHeight}px`);
        oSideList.getBinding('items').filter([oStatFilter]);
      },

      async loadProfile({ oViewModel, sPernr }) {
        const oViewModelData = oViewModel.getData();
        const oModel = this.getModel(ServiceNames.PA);
        let aFilters = [];
        let mFilters = {};
        let aHeaderRequests = [];
        let aContentRequests = [];

        if (sPernr) {
          mFilters.Pernr = sPernr;
          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        try {
          // 1. 상단 프로필, 탭 메뉴, 주소유형, 시/도
          const [oProfileReturnData, mMenuReturnData, mCountryList, mMajorList, mCertList, mCertGradeList, mAddressTypeData, mAddressCityData, mSchoolTypeList, mLanguageTypeList, mTestGradeList] = await Promise.all([
            this.readOdata({ sUrl: '/EmpProfileHeaderNewSet', mFilters }),
            this.readOdata({ sUrl: '/EmpProfileMenuSet', mFilters }),
            this.readOdata({ sUrl: '/CountryCodeSet' }),
            this.readOdata({ sUrl: '/MajorCodeSet' }),
            this.readOdata({ sUrl: '/CertificateCodeSet' }),
            this.readOdata({ sUrl: '/CertificateGradeCodeSet' }),
            this.readComboEntry({ oModel, sUrl: '/PaCodeListSet', sPath: 'typeList', mFilters: { Cdnum: 'CM0002', Grcod: '0006' } }),
            this.readComboEntry({ oModel, sUrl: '/CityListSet', sPath: 'sidoList', sPernr, oEntryInfo: { codeKey: 'State', valueKey: 'Bezei' } }),
            this.readComboEntry({ oModel, sUrl: '/SchoolTypeCodeSet', sPath: 'schoolTypeList', oEntryInfo: { codeKey: 'Slart', valueKey: 'Stext' } }),
            this.readComboEntry({ oModel, sUrl: '/LanguageTypeCodeSet', sPath: 'languageTypeList', oEntryInfo: { codeKey: 'Quali', valueKey: 'Qualitx' } }),
            this.readComboEntry({ oModel, sUrl: '/TestGradeCodeSet', sPath: 'gradeList', oEntryInfo: { codeKey: 'Eamgr', valueKey: 'Eamgrtx' } }),
          ]);

          // Dialog Combo entry set
          oViewModel.setProperty('/employee/dialog/countryList', mCountryList);
          oViewModel.setProperty('/employee/dialog/majorList', mMajorList);
          oViewModel.setProperty('/employee/dialog/typeList', mAddressTypeData);
          oViewModel.setProperty('/employee/dialog/sidoList', mAddressCityData);
          oViewModel.setProperty('/employee/dialog/schoolTypeList', mSchoolTypeList);
          oViewModel.setProperty('/employee/dialog/languageTypeList', mLanguageTypeList);
          oViewModel.setProperty('/employee/dialog/gradeList', mTestGradeList);
          oViewModel.setProperty('/employee/dialog/certificateList', mCertList);
          oViewModel.setProperty('/employee/dialog/certificateGradeList', mCertGradeList);
          //End Dialog Combo entry set

          // 상단 프로필 Set
          const { Pturl, ...oReturnData } = oProfileReturnData[0];
          delete oReturnData.Pernr;
          delete oReturnData.Langu;
          delete oReturnData.Prcty;
          delete oReturnData.Actty;
          delete oReturnData.__metadata;
          const aTextFields = ['Dat03', 'Dat08', 'Dat13', 'Dat18', 'Dat23'];
          const aConvertData = Object.keys(oReturnData).map((key) => ({ data: oReturnData[key], isText: _.includes(aTextFields, key) }));

          oViewModel.setProperty('/employee/header/profilePath', Pturl);
          oViewModel.setProperty('/employee/header/baseInfo', aConvertData);
          //End 상단 프로필 Set

          // 탭 메뉴 Set
          const aTabMenus = _.filter(mMenuReturnData, { Child: '1' }).map((obj, index) => ({ Pressed: index === 0, ...obj }));
          const aSubMenus = mMenuReturnData.filter((data) => data.Child !== '1');

          oViewModel.setProperty('/employee/tab/list', aTabMenus);
          oViewModel.setProperty('/employee/tab/menu', aSubMenus);

          aTabMenus.forEach((data) => {
            this.debug(`Tab ${data.Menu1}`, data);
            oViewModelData.employee.sub[data.Menuc1] = { isShow: data.Pressed, contents: {} };
          });

          aSubMenus.forEach((data) => {
            oViewModelData.employee.sub[data.Menuc1].contents[data.Menuc2] = {
              type: data.Child,
              rowCount: 1,
              selectionMode: _.some(this.CRUD_TABLES, (o) => o.key === data.Menuc2) ? 'MultiToggle' : 'None',
              title: data.Menu2,
              code: data.Menuc2,
              sort: data.Sorts,
              header: [],
              data: [],
            };
          });
          //End 탭 메뉴 Set

          aTabMenus.map((data) => {
            aHeaderRequests.push(this.readOdata({ sUrl: '/EmpProfileHeaderTabSet', mFilters: { Menuc: data.Menuc1, ...mFilters } }));
            aContentRequests.push(this.readOdata({ sUrl: '/EmpProfileContentsTabSet', mFilters: { Menuc: data.Menuc1, ...mFilters } }));
          });

          // 2. Sub 영역 조회[header, contents]
          const aHeaderReturnData = await Promise.all(aHeaderRequests);
          const aContentReturnData = await Promise.all(aContentRequests);

          // Header 영역 Set
          aHeaderReturnData.forEach((headers, index) => {
            headers.forEach((o) => {
              oViewModelData.employee.sub[aTabMenus[index].Menuc1].contents[o.Menuc].header.push(o);
            });
          });
          //End Header 영역 Set

          // Contents 영역 Set
          aContentReturnData.forEach((content, index) => {
            content.forEach((o) => {
              let oSubMenu = oViewModelData.employee.sub[aTabMenus[index].Menuc1].contents[o.Menuc];

              if (oSubMenu.type === this.SUB_TYPE.GRID) {
                for (let i = 1; i <= oSubMenu.header.length; i++) {
                  let sKey = `Value${_.padStart(i, 2, '0')}`;
                  oSubMenu.data.push(o[sKey]);
                }
              } else if (oSubMenu.type === this.SUB_TYPE.TABLE) {
                oSubMenu.data.push(o);
              }

              oSubMenu.rowCount = oSubMenu.data.length;
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
          oViewModel.setProperty('/employee/busy', false);
        }
      },

      makeProfileBody() {
        const oViewModel = this.getViewModel();
        const oParentBox = this.byId('profileBody');
        const mSubMenu = oViewModel.getProperty('/employee/sub');

        Object.keys(mSubMenu).forEach((menuKey) => {
          let mSubMenuContents = mSubMenu[menuKey].contents;
          let oVBox = sap.ui.getCore().byId(`sub${menuKey}`);

          if (oVBox) {
            oVBox.destroyItems();
            oParentBox.removeItem(oVBox);
          } else {
            oVBox = new sap.m.VBox({ id: `sub${menuKey}`, visible: { path: `/employee/sub/${menuKey}/isShow` } });
          }

          /**
           * OMenu.type: '5'  Table
           *      - 주소 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(mSubMenuContents).forEach((key) => {
            let oMenu = mSubMenuContents[key];
            let oSubVBox = new sap.m.VBox().addStyleClass('customBox sapUiMediumMarginBottom');
            let oSubHBox = new sap.m.HBox({ justifyContent: 'SpaceBetween' });

            this.debug(`Sub ${oMenu.title}`, oMenu);

            oSubHBox.addItem(new sap.m.Title({ level: 'H2', text: oMenu.title }));
            if (_.some(this.CRUD_TABLES, (o) => o.key === oMenu.code)) {
              let oSubButtonBox = new sap.m.HBox();

              oSubButtonBox.addItem(
                new sap.m.Button({
                  type: 'Transparent',
                  icon: 'sap-icon://add',
                  text: this.getBundleText('LABEL_00106'), // 등록
                  customData: [new sap.ui.core.CustomData({ key: 'code', value: oMenu.code })],
                  press: this.onPressRegTable.bind(this),
                }).addStyleClass('sapUiTinyMarginEnd')
              );
              oSubButtonBox.addItem(
                new sap.m.Button({
                  type: 'Transparent',
                  icon: 'sap-icon://edit',
                  text: this.getBundleText('LABEL_00108'), // 수정
                  customData: [new sap.ui.core.CustomData({ key: 'code', value: oMenu.code })],
                  press: this.onPressModifyTable.bind(this),
                }).addStyleClass('sapUiTinyMarginEnd')
              );
              oSubButtonBox.addItem(
                new sap.m.Button({
                  type: 'Transparent',
                  icon: 'sap-icon://less',
                  text: this.getBundleText('LABEL_00110'), // 삭제
                  customData: [new sap.ui.core.CustomData({ key: 'code', value: oMenu.code })],
                  press: this.onPressDeleteTable.bind(this),
                })
              );
              oSubHBox.addItem(oSubButtonBox);
            }

            oSubVBox.addItem(oSubHBox);

            if (oMenu.type === this.SUB_TYPE.TABLE) {
              const sTableDataPath = `/employee/sub/${menuKey}/contents/${key}`;
              let oTable = new Table({
                width: '100%',
                columnHeaderHeight: 50,
                rowHeight: 50,
                selectionMode: { path: `${sTableDataPath}/selectionMode` },
                visibleRowCount: { path: `${sTableDataPath}/rowCount` },
                noData: this.getBundleText('MSG_00001'),
              }).bindRows(`${sTableDataPath}/data`);

              oMenu.header.forEach((head, index) => {
                if (!head.Invisible) {
                  let oColumn = new sap.ui.table.Column({ width: 'auto' });

                  oColumn.setLabel(new sap.m.Label({ text: head.Header }));
                  oColumn.setTemplate(new sap.m.Text({ width: '100%', textAlign: 'Center', text: { path: `Value${_.padStart(index + 1, 2, '0')}` } }));
                  oTable.addColumn(oColumn);
                }
              });

              oSubVBox.addItem(oTable);
            } else if (oMenu.type === this.SUB_TYPE.GRID) {
              let oCSSGrid = new CSSGrid({ gridTemplateColumns: '1fr 3fr 1fr 3fr', gridGap: '2px' });

              oMenu.header.forEach((head, index) => {
                oCSSGrid.addItem(new sap.m.Label({ text: head.Header }));
                oCSSGrid.addItem(new sap.m.Text({ text: oMenu.data[index] }));
              });

              oSubVBox.addItem(oCSSGrid);
            }

            oVBox.addItem(oSubVBox);
          });

          oParentBox.addItem(oVBox);
        });
      },

      openInputFormDialog() {
        const oView = this.getView();

        AppUtils.setAppBusy(true, this);

        setTimeout(() => {
          if (!this._pInputFormDialog) {
            this._pInputFormDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.employee.fragment.InputFormDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this._pInputFormDialog.then(function (oDialog) {
            AppUtils.setAppBusy(false, this);
            oDialog.open();
          });
        }, 100);
      },

      openSelectDialog({ path, codeKey, valueKey, fragmentName }) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const mItems = oViewModel.getProperty(`/employee/dialog/${path}`);
        const sInputCode = oViewModel.getProperty(`/employee/dialog/form/${codeKey}`);

        AppUtils.setAppBusy(true, this);

        if (!this[`_p${fragmentName}`]) {
          this[`_p${fragmentName}`] = Fragment.load({
            id: oView.getId(),
            name: `sap.ui.yesco.mvc.view.employee.fragment.form.${fragmentName}`,
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this[`_p${fragmentName}`].then(async (oDialog) => {
          if (sInputCode) {
            oDialog.getBinding('items').filter(new Filter(codeKey, FilterOperator.EQ, sInputCode));
          }

          oViewModel.setProperty(
            `/employee/dialog/${path}`,
            mItems.map((o) => ({
              ...o,
              selected: o[codeKey] === sInputCode,
            }))
          );

          oViewModel.setProperty('/employee/dialog/selectedHelpDialog', { codeKey, valueKey });
          AppUtils.setAppBusy(false, this);
          oDialog.open();
        });
      },

      async refreshTableContents({ oViewModel, sMenuKey }) {
        try {
          const oMenuInfo = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menuc2: sMenuKey });
          const sSubTablePath = `/employee/sub/${oMenuInfo.Menuc1}/contents/${oMenuInfo.Menuc2}`;
          const mFilters = { Pernr: oMenuInfo.Pernr, Menuc: oMenuInfo.Menuc1 };
          const mReturnContents = await this.readOdata({ sUrl: '/EmpProfileContentsTabSet', mFilters });
          const mTableData = _.filter(mReturnContents, { Menuc: oMenuInfo.Menuc2 });

          oViewModel.setProperty(`${sSubTablePath}/data`, mTableData);
          oViewModel.setProperty(`${sSubTablePath}/rowCount`, mTableData.length);
        } catch (oError) {
          this.debug('Controller > Employee > refreshTableContents Error', oError);

          throw oError;
        }
      },

      getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields }) {
        const sRowPath = oTable.getRows()[aSelectedIndices[0]].getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(sRowPath);
        const oMenu = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menuc2: oRowData.Menuc });
        const mHeaderData = oViewModel.getProperty(`/employee/sub/${oMenu.Menuc1}/contents/${oMenu.Menuc2}/header`);
        const oFieldSet = aFields.reduce((acc, cur) => {
          acc[cur] = oRowData[`Value${_.padStart(_.findIndex(mHeaderData, { Fieldname: _.upperCase(cur) }) + 1, 2, '0')}`];
          return acc;
        }, {});

        return {
          Pernr: oRowData.Pernr,
          ...oFieldSet,
        };
      },

      /**
       * OData에서 받은 데이터를 Tree구조 데이터로 변환한다.
       * 최상위 키는 "00000000"
       * 현재 키(Objid)와 부모 키(PupObjid)를 비교하여 같으면 부모의 nodes에 추가한다.
       * Otype이 "O"(부서)인 경우 nodes를 초기화하고 dummy 아이템을 추가한다.(expand event 발생시 해당 부서의 child nodes를 조회)
       *
       * @param {Array} mReturnTreeData - OData return list
       * @param {number} rootId - "00000000" 또는 부서코드
       * 							"00000000"인 경우 rootNodes를 반환(Model-/TreeData setData)
       * 							부서코드인 경우 rootNodes[0].nodes를 반환(이미 생성된 부모.nodes에 append)
       *
       * @returns {Array<Object>} - Tree data object
       */
      transformTreeData({ mReturnTreeData, rootId }) {
        let rootNodes = [];
        let traverse = (nodes, item, index) => {
          if (nodes instanceof Array) {
            return nodes.some((node) => {
              if (node.Objid === item.ObjidUp) {
                node.nodes = node.nodes || [];

                delete item.__metadata;
                delete item.Datum;
                mReturnTreeData.splice(index, 1);

                let oAddItem = $.extend(true, item, {
                  ref: item.Otype === 'O' ? 'sap-icon://org-chart' : item.Xchif === 'X' ? 'sap-icon://manager' : 'sap-icon://employee',
                });

                if (item.Otype === 'O') {
                  oAddItem.nodes = [{ Stext: '-', dummy: true }];
                }

                return node.nodes.push(oAddItem);
              }

              return traverse(node.nodes, item, index);
            });
          }
        };

        while (mReturnTreeData.length > 0) {
          mReturnTreeData.some((item, index) => {
            if (item.ObjidUp === '00000000') {
              delete item.__metadata;
              delete item.Datum;
              mReturnTreeData.splice(index, 1);

              return rootNodes.push(
                $.extend(true, item, {
                  ref: item.Otype === 'O' ? 'sap-icon://org-chart' : item.Xchif === 'X' ? 'sap-icon://manager' : 'sap-icon://employee',
                })
              );
            }

            return traverse(rootNodes, item, index);
          });
        }

        return rootId !== '00000000' ? rootNodes[0].nodes : rootNodes;
      },

      async uploadInputFormFiles(sMenuKey) {
        const oViewModel = this.getViewModel();
        const oOriginFiles = oViewModel.getProperty('/employee/dialog/file/originFile');
        const oFiles = oViewModel.getProperty('/employee/dialog/file/newFile');
        let sAppno = oViewModel.getProperty('/employee/dialog/form/Appno');

        if (!oFiles.length) return sAppno;

        try {
          if (!sAppno) sAppno = await Appno.get();

          if (!_.isEmpty(oOriginFiles)) await AttachFileAction.deleteFile(sAppno, sMenuKey, oOriginFiles[0].Seqnr);

          await AttachFileAction.upload.call(this, sAppno, sMenuKey, oFiles);
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
        const bState = oEvent.getParameter('state');

        this.getView().getModel().setProperty('/sideNavigation/isShow', bState);
        this.getView()
          .getModel()
          .setProperty('/sideNavigation/width', bState ? '27%' : '0%');
        this.getView()
          .getModel()
          .setProperty('/employee/width', bState ? '73%' : '100%');
      },

      async onSelectSideTab(oEvent) {
        const oViewModel = this.getView().getModel();
        const sSelectedKey = oEvent.getParameter('key');
        const bTreeLoaded = oViewModel.getProperty('/sideNavigation/treeLoaded');

        if (!bTreeLoaded && sSelectedKey === 'tree') {
          const mReturnTreeData = await this.readOdata({ sUrl: '/AuthOrgTreeSet', mFilters: { Datum: moment().hour(9).toDate(), Xpern: 'X' } });
          const mConvertedTreeData = this.transformTreeData({ mReturnTreeData, rootId: '00000000' });

          this.debug('mConvertedTreeData', mConvertedTreeData);
          oViewModel.setProperty('/sideNavigation/treeData', mConvertedTreeData);

          const oSideTree = this.byId('OrganizationTree');
          const iTreeViewHeight = Math.floor($(document).height() - oSideTree.$().offset().top - 35);
          oViewModel.setProperty('/sideNavigation/treeHeight', `${iTreeViewHeight}px`);
        }

        oViewModel.setProperty('/sideNavigation/treeLoaded', true);
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
        const oSessionData = this.getOwnerComponent().getSessionModel().getData();
        const oSearchParam = {
          searchText: sSearchText,
          ...oSessionData,
        };

        if (!sSearchText) {
          MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_00201')); // {검색어}를 입력하세요.
          return;
        } else if (sSearchText.length < 2) {
          MessageBox.alert(this.getBundleText('MSG_00026')); // 성명은 2자 이상이어야 합니다.
          return;
        }

        try {
          const oSearchResults = await this.readEmpSearchResult({ oSearchParam });

          oViewModel.setProperty('/sideNavigation/search/results', oSearchResults);
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

        if (!sPernr) {
          MessageBox.error(this.getBundleText('MSG_00035')); // 대상자 사번이 없습니다.
          return;
        } else if (sPrevPernr === sPernr) {
          return;
        }

        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.loadProfile({ oViewModel, sPernr });
      },

      onSelectTreeItem(oEvent) {
        const oViewModel = this.getView().getModel();
        const oSelectContext = oEvent.getParameter('listItem').getBindingContext();
        const oSelectedItem = oSelectContext.getProperty();
        const sPernr = oSelectedItem.Objid;

        this.debug('oSelectedItem', oSelectedItem);

        if (oSelectedItem.Otype === 'P') {
          oViewModel.setProperty('/employee/busy', true);
          oViewModel.setProperty('/pernr', sPernr);

          this.loadProfile({ oViewModel, sPernr });
        }
      },

      onToggleTab(oEvent) {
        const oViewModel = this.getView().getModel();
        const aSubTabs = oViewModel.getProperty('/employee/sub');
        const sSelectedKey = oEvent.getParameter('key');

        Object.keys(aSubTabs).forEach((subId) => {
          if (subId === sSelectedKey) {
            oViewModel.setProperty(`/employee/sub/${subId}/isShow`, true);
          } else {
            oViewModel.setProperty(`/employee/sub/${subId}/isShow`, false);
          }
        });
      },

      onPressRegTable(oEvent) {
        const oViewModel = this.getView().getModel();
        const sSelectedMenuCode = oEvent.getSource().getCustomData()[0].getValue();
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
            const oKoreaObject = _.find(mCountryList, { Sland: 'KR' });

            oViewModel.setProperty('/employee/dialog/form', {
              Slart: sDefaultSelectedKey,
              Sland: oKoreaObject.Sland,
              Landx50: oKoreaObject.Landx50,
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
            oViewModel.setProperty('/employee/dialog/form', {});
            break;
          default:
            break;
        }

        this.openInputFormDialog();
      },

      async onSaveInputForm() {
        const oViewModel = this.getView().getModel();
        const mFieldValue = oViewModel.getProperty('/employee/dialog/form');
        const sAction = oViewModel.getProperty('/employee/dialog/action');
        const sActionText = oViewModel.getProperty('/employee/dialog/actionText');
        const sMenuKey = oViewModel.getProperty('/employee/dialog/subKey');
        const sPrcty = sAction === 'A' ? 'C' : 'U';
        let oInputData = {};
        let aFieldProperties = [];
        let sUrl = '';
        let sAppno = '';

        try {
          AppUtils.setAppBusy(true, this);

          switch (sMenuKey) {
            case this.CRUD_TABLES.ADDRESS.key:
              sUrl = this.CRUD_TABLES.ADDRESS.url;
              aFieldProperties = this.CRUD_TABLES.ADDRESS.valid;

              const oSido = _.find(oViewModel.getProperty('/employee/dialog/sidoList'), { State: mFieldValue.State });
              oInputData = { ...oSido, ...mFieldValue, Begda: moment(mFieldValue.Begda).hour(9).toDate() };

              break;
            case this.CRUD_TABLES.EDUCATION.key:
              sUrl = this.CRUD_TABLES.EDUCATION.url;
              aFieldProperties = this.CRUD_TABLES.EDUCATION.valid;
              sAppno = await this.uploadInputFormFiles(this.CRUD_TABLES.EDUCATION.key);

              oInputData = {
                ...mFieldValue,
                Prcty: sPrcty,
                Appno: sAppno,
                Zzfinyn: mFieldValue.Zzfinyn ? 'X' : '',
                Zzrecab: mFieldValue.Zzrecab ? 'X' : '',
                Begda: mFieldValue.Begda ? moment(mFieldValue.Begda).hour(9).toDate() : mFieldValue.Begda,
                Endda: mFieldValue.Endda ? moment(mFieldValue.Endda).hour(9).toDate() : mFieldValue.Endda,
              };

              break;
            case this.CRUD_TABLES.LANGUAGE.key:
              sUrl = this.CRUD_TABLES.LANGUAGE.url;
              aFieldProperties = this.CRUD_TABLES.LANGUAGE.valid;
              sAppno = await this.uploadInputFormFiles(this.CRUD_TABLES.LANGUAGE.key);

              oInputData = {
                ...mFieldValue,
                Prcty: sPrcty,
                Appno: sAppno,
                Begda: mFieldValue.Eamdt ? moment(mFieldValue.Eamdt).hour(9).toDate() : mFieldValue.Begda,
                Endda: mFieldValue.Eamdt ? moment(mFieldValue.Eamdt).hour(9).toDate() : mFieldValue.Endda,
                Eamdt: mFieldValue.Eamdt ? moment(mFieldValue.Eamdt).hour(9).toDate() : mFieldValue.Eamdt,
              };

              break;
            case this.CRUD_TABLES.CERTIFICATE.key:
              sUrl = this.CRUD_TABLES.CERTIFICATE.url;
              aFieldProperties = this.CRUD_TABLES.CERTIFICATE.valid;
              sAppno = await this.uploadInputFormFiles(this.CRUD_TABLES.CERTIFICATE.key);

              oInputData = {
                ...mFieldValue,
                Prcty: sPrcty,
                Appno: sAppno,
                Begda: mFieldValue.Regdt ? moment(mFieldValue.Regdt).hour(9).toDate() : mFieldValue.Begda,
                Endda: mFieldValue.Regdt ? moment(mFieldValue.Regdt).hour(9).toDate() : mFieldValue.Endda,
                Regdt: mFieldValue.Regdt ? moment(mFieldValue.Regdt).hour(9).toDate() : mFieldValue.Regdt,
              };

              break;
            default:
              break;
          }

          if (!Validator.check({ mFieldValue: oInputData, aFieldProperties })) return;

          await this.createInputForm({ oViewModel, sUrl, oInputData });

          // {추가|수정}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', sActionText), {
            onClose: () => {
              this.refreshTableContents({ oViewModel, sMenuKey });
              this.onInputFormDialogClose();
            },
          });
        } catch (oError) {
          this.debug('Controller > Employee > onSaveInputForm Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      async onPressModifyTable(oEvent) {
        const oModel = this.getModel(ServiceNames.PA);
        const oViewModel = this.getView().getModel();
        const oControl = oEvent.getSource();
        const oTable = oControl.getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();
        const sSelectedMenuCode = oControl.getCustomData()[0].getValue();
        const sMenuKey = _.lowerCase(_.findKey(this.CRUD_TABLES, { key: sSelectedMenuCode }));

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00010', 'LABEL_00108')); // {수정}할 데이터를 선택하세요.
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert(this.getBundleText('MSG_00038')); // 하나의 행만 선택하세요.
          return;
        }

        try {
          const oTableInfo = this.CRUD_TABLES[_.upperCase(sMenuKey)];
          const aFields = oTableInfo.pk;
          const sUrl = oTableInfo.url;
          const sLabel = this.getBundleText(oTableInfo.label);
          const mFilters = this.getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields });

          oViewModel.setProperty('/employee/dialog/subKey', sSelectedMenuCode);
          oViewModel.setProperty('/employee/dialog/subLabel', sLabel);
          oViewModel.setProperty('/employee/dialog/action', 'U');
          oViewModel.setProperty('/employee/dialog/actionText', this.getBundleText('LABEL_00108'));
          oViewModel.setProperty('/employee/dialog/file/originFile', []);
          oViewModel.setProperty('/employee/dialog/file/newFile', []);

          switch (sMenuKey) {
            case this.CRUD_TABLES.ADDRESS.path:
              mFilters.Begda = moment(mFilters.Begda).hour(9).toDate();

              break;
            case this.CRUD_TABLES.EDUCATION.path:
            case this.CRUD_TABLES.LANGUAGE.path:
            case this.CRUD_TABLES.CERTIFICATE.path:
              mFilters.Begda = moment(mFilters.Begda).hour(9).toDate();
              mFilters.Endda = moment(mFilters.Endda).hour(9).toDate();

              break;
            default:
              break;
          }

          const mTableRowDetail = await this.readOdata({ sUrl, mFilters });

          if (_.isEmpty(mTableRowDetail)) throw Error(this.getBundleText('MSG_00034')); // 조회할 수 없습니다.

          const oTableRowDetail = mTableRowDetail[0];

          // 체크박스 value <-> Boolean 변환
          if (_.has(oTableRowDetail, 'Zzfinyn')) oTableRowDetail.Zzfinyn = oTableRowDetail.Zzfinyn === 'X';
          if (_.has(oTableRowDetail, 'Zzrecab')) oTableRowDetail.Zzrecab = oTableRowDetail.Zzrecab === 'X';

          oViewModel.setProperty('/employee/dialog/form', oTableRowDetail);

          // 국가,학위 엔트리 조회
          if (_.has(oTableRowDetail, 'Slart')) {
            const mFilters = { Slart: oTableRowDetail.Slart };
            const [mSchoolList, mDegreeList] = await Promise.all([
              this.readOdata({ sUrl: '/SchoolCodeSet', mFilters }), //
              this.readComboEntry({ oModel, sUrl: '/DegreeCodeSet', mFilters, oEntryInfo: { codeKey: 'Slabs', valueKey: 'Stext' } }),
            ]);

            oViewModel.setProperty('/employee/dialog/degreeList', mDegreeList);
            oViewModel.setProperty('/employee/dialog/schoolList', mSchoolList);
          } else if (_.has(oTableRowDetail, 'Quali')) {
            // 시험구분 엔트리 조회
            const mFilters = { Quali: oTableRowDetail.Quali };
            const mExamList = await this.readComboEntry({ oModel, sUrl: '/TestTypeCodeSet', mFilters, oEntryInfo: { codeKey: 'Exmty', valueKey: 'Exmtytx' } });

            oViewModel.setProperty('/employee/dialog/examTypeList', mExamList);
          }

          // 파일 조회
          if (_.has(oTableRowDetail, 'Appno')) {
            const mFileList = await AttachFileAction.readFileList(oTableRowDetail.Appno, sSelectedMenuCode);

            if (!_.isEmpty(mFileList)) {
              oViewModel.setProperty('/employee/dialog/file/originFile', mFileList);
              oViewModel.setProperty('/employee/dialog/form', { ...mFileList[0], ...oTableRowDetail });
            }
          }

          this.openInputFormDialog(oEvent);
          oTable.clearSelection();
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
        const sSelectedMenuCode = oControl.getCustomData()[0].getValue();
        const sMenuKey = _.lowerCase(_.findKey(this.CRUD_TABLES, { key: sSelectedMenuCode }));

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00010', 'LABEL_00110')); // {삭제}할 데이터를 선택하세요.
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert(this.getBundleText('MSG_00038')); // 하나의 행만 선택하세요.
          return;
        }

        AppUtils.setAppBusy(true, this);

        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), MessageBox.Action.CANCEL], // 삭제
          onClose: async (sAction) => {
            if (!sAction || sAction !== MessageBox.Action.CANCEL) {
              const oTableInfo = this.CRUD_TABLES[_.upperCase(sMenuKey)];
              const aFields = oTableInfo.pk;
              const sUrl = oTableInfo.url;
              const oPayload = this.getTableRowData({ oViewModel, oTable, aSelectedIndices, aFields });

              try {
                switch (sMenuKey) {
                  case this.CRUD_TABLES.ADDRESS.path:
                    oPayload.Begda = moment(oPayload.Begda).hour(9).toDate();

                    break;
                  case this.CRUD_TABLES.EDUCATION.path:
                  case this.CRUD_TABLES.LANGUAGE.path:
                  case this.CRUD_TABLES.CERTIFICATE.path:
                    oPayload.Begda = moment(oPayload.Begda).hour(9).toDate();
                    oPayload.Endda = moment(oPayload.Endda).hour(9).toDate();

                    break;
                  default:
                    break;
                }

                await this.deleteTableRow({ sUrl, oPayload });

                oTable.clearSelection();
                this.refreshTableContents({ oViewModel, sMenuKey: sSelectedMenuCode });

                MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00110')); // {삭제}되었습니다.
              } catch (oError) {
                this.debug('Controller > Employee > onPressDeleteTable Error', oError);

                AppUtils.handleError(oError);
              }
            }

            AppUtils.setAppBusy(false, this);
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
          const [mSchoolList, mDegreeList] = await Promise.all([
            this.readOdata({ sUrl: '/SchoolCodeSet', mFilters }),
            this.readComboEntry({ oModel, sUrl: '/DegreeCodeSet', mFilters, oEntryInfo: { codeKey: 'Slabs', valueKey: 'Stext' } }), //
          ]);

          oViewModel.setProperty('/employee/dialog/form/Slabs', 'ALL');
          oViewModel.setProperty('/employee/dialog/degreeList', mDegreeList);
          oViewModel.setProperty('/employee/dialog/schoolList', mSchoolList);
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
          const mExamList = await this.readComboEntry({ oModel, sUrl: '/TestTypeCodeSet', mFilters, oEntryInfo: { codeKey: 'Exmty', valueKey: 'Exmtytx' } });

          oViewModel.setProperty('/employee/dialog/form/Exmty', 'ALL');
          oViewModel.setProperty('/employee/dialog/examTypeList', mExamList);
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
        const oFormData = oViewModel.getProperty('/employee/dialog/form');
        const aPointFields = ['Spont', 'Hpont', 'Rpont', 'Wpont'];

        oViewModel.setProperty(sPath, String(Number(oControl.getValue())));
        oViewModel.setProperty('/employee/dialog/form/Tpont', String(aPointFields.reduce((acc, cur) => acc + _.defaultTo(Number(oFormData[cur]), 0), 0)));
      },

      onPressHelpCountry() {
        this.openSelectDialog(this.SELECT_DIALOG.COUNTRY);
      },

      onPressHelpSchool() {
        this.openSelectDialog(this.SELECT_DIALOG.SCHOOL);
      },

      onPressHelpMajor() {
        this.openSelectDialog(this.SELECT_DIALOG.MAJOR);
      },

      onPressHelpCertificate() {
        this.openSelectDialog(this.SELECT_DIALOG.CERTIFICATE);
      },

      onPressHelpCertificateGrade() {
        this.openSelectDialog(this.SELECT_DIALOG.CERTIFICATE_GRADE);
      },

      onSearchDialogHelp(oEvent) {
        const oHelpDialogInfo = this.getViewModel().getProperty('/employee/dialog/selectedHelpDialog');

        oEvent.getParameter('itemsBinding').filter([
          new Filter(oHelpDialogInfo.valueKey, FilterOperator.Contains, oEvent.getParameter('value')), //
        ]);
      },

      onCloseDialogHelp(oEvent) {
        const oViewModel = this.getViewModel();
        const oHelpDialogInfo = oViewModel.getProperty('/employee/dialog/selectedHelpDialog');
        const oSelectedItem = oEvent.getParameter('selectedItem');

        oViewModel.setProperty(`/employee/dialog/form/${oHelpDialogInfo.codeKey}`, oSelectedItem.getDescription());
        oViewModel.setProperty(`/employee/dialog/form/${oHelpDialogInfo.valueKey}`, oSelectedItem.getTitle());
      },

      openSearchZipCodePopup() {
        window.open('postcodeForBrowser.html?CBF=fn_SetAddr', 'pop', 'width=550,height=550, scrollbars=yes, resizable=yes');
      },

      onInputFormDialogClose() {
        AppUtils.setAppBusy(false, this);
        this.byId('inputFormDialog').close();
      },

      onInputFormFileChange(oEvent) {
        const oViewModel = this.getViewModel();
        const oFileUploader = oEvent.getSource();
        const oFiles = oEvent.getParameter('files');
        const oFormData = oViewModel.getProperty('/employee/dialog/form');

        oViewModel.setProperty('/employee/dialog/file/newFile', [...oFiles]);
        oViewModel.setProperty('/employee/dialog/form', { ...oFormData, Zfilename: oFiles[0].name });

        oFileUploader.clear();
        oFileUploader.setValue('');
      },

      onPressFileLink() {
        const oViewModel = this.getViewModel();
        const sUrl = oViewModel.getProperty('/employee/dialog/form/Fileuri');

        AttachFileAction.openFileLink(sUrl);
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      readEmpSearchResult({ oSearchParam }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.COMMON);
          const sUrl = '/EmpSearchResultSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Persa', FilterOperator.EQ, oSearchParam.Werks), //
              new Filter('Zflag', FilterOperator.EQ, 'X'),
              new Filter('Actda', FilterOperator.EQ, moment().hour(9).toDate()),
              new Filter('Ename', FilterOperator.EQ, oSearchParam.searchText),
            ],
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

      readComboEntry({ oModel, sUrl, sPath, sPernr, mFilters = {}, oEntryInfo = { codeKey: 'Zcode', valueKey: 'Ztext' } }) {
        return new Promise((resolve, reject) => {
          const oViewModel = this.getViewModel();
          const mEntries = oViewModel.getProperty(`/employee/dialog/${sPath}`);

          if (sPath && mEntries.length > 1) resolve(mEntries);
          if (sPernr) mFilters.Pernr = sPernr;

          oModel.read(sUrl, {
            filters: Object.keys(mFilters).map((field) => {
              return new Filter(field, FilterOperator.EQ, mFilters[field]);
            }),
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(new ComboEntry({ ...oEntryInfo, mEntries: oData.results }));
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
            filters: Object.keys(mFilters).map((field) => {
              return new Filter(field, FilterOperator.EQ, mFilters[field]);
            }),
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

      createInputForm({ oViewModel, sUrl, oInputData }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sAction = oViewModel.getProperty('/employee/dialog/action');

          oModel.create(sUrl, oInputData, {
            success: () => {
              resolve();
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(sAction === 'U' ? new ODataUpdateError(oError) : new ODataCreateError('A', oError));
            },
          });
        });
      },

      deleteTableRow({ sUrl, oPayload }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sUrlByKey = oModel.createKey(sUrl, oPayload);

          oModel.remove(sUrlByKey, {
            success: () => {
              resolve();
            },
            error: (oError) => {
              this.debug(`${sUrlByKey} error.`, oError);

              reject(new ODataDeleteError(oError)); // {삭제}중 오류가 발생하였습니다.
            },
          });
        });
      },
    });
  }
);

// eslint-disable-next-line no-unused-vars
function fn_SetAddr(Zip, fullAddr) {
  const oView = sap.ui.getCore().byId('container-ehr---employee');
  const oViewModel = oView.getModel();

  oViewModel.setProperty('/employee/dialog/form/Pstlz', Zip);
  oViewModel.setProperty('/employee/dialog/form/Zzaddr1', fullAddr);
}
