sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/ui/core/CustomData',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/table/Table',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/talentDev/TalentDevDialogHandler',
  ],
  (
    // prettier 방지용 주석
    FlexItemData,
    CustomData,
    CSSGrid,
    Table,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController,
    TalentDevDialogHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.Document', {
      PostcodeDialogHandler: null,

      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },
      ICONS: {
        FILE1: 'sap-icon://attachment',
        FILE2: 'sap-icon://attachment',
        RESOL: 'sap-icon://comment',
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
              profilePath: this.getUnknownAvatarImageURL(),
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

      onObjectMatched(oParameter) {
        sap.ui.getCore().byId('container-ehr---app--appMenuToolbar').setVisible(false);

        const oViewModel = this.getViewModel();
        const sRoute = this.getRouter().getHashChanger().getHash();
        const mSessionData = this.getAppointeeData();
        const Usrty = _.defaultTo(oParameter.usrty, '');
        let sPernr = oParameter.pernr || mSessionData.Pernr;
        let sOrgtx = _.replace(oParameter.orgtx, /--/g, '/') ?? _.noop();
        let sOrgeh = oParameter.orgeh ?? _.noop();

        setTimeout(() => $('#container-ehr---app--app').addClass('popup-body'), 200);

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

        if (!_.isEqual(sPernr, 'NA')) this.loadProfile({ oViewModel, sPernr, Usrty });
      },

      async loadProfile({ oViewModel, sPernr, Usrty }) {
        const oViewModelData = oViewModel.getData();
        const oModel = this.getModel(ServiceNames.PA);
        let mFilters = {};
        let aHeaderRequests = [];
        let aContentRequests = [];

        if (sPernr) mFilters.Pernr = sPernr;

        try {
          // 1. 상단 프로필, 탭 메뉴, 주소유형, 시/도
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
          ] = await Promise.all([
            fCurriedGetEntitySet('EmpProfileHeaderNew', mFilters),
            fCurriedGetEntitySet('EmpProfileMilestone', mFilters),
            fCurriedGetEntitySet('EmpProfileMenu', { ...mFilters, Usrty }),
            fCurriedGetEntitySet('CountryCode'),
            fCurriedGetEntitySet('MajorCode'),
            fCurriedGetEntitySet('CertificateCode'),
            fCurriedGetEntitySet('CertificateGradeCode'),
            fCurriedGetEntitySet('PaCodeList', { Cdnum: 'CM0002', Grcod: '0006' }),
            fCurriedGetEntitySet('CityList', { Pernr: sPernr }),
            fCurriedGetEntitySet('SchoolTypeCode'),
            fCurriedGetEntitySet('LanguageTypeCode'),
            fCurriedGetEntitySet('TestGradeCode'),
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
          // End Dialog Combo entry set

          // 상단 프로필 Set
          const { Pturl, ...oReturnData } = aProfileReturnData[0];
          const aTextFields = ['Dat03', 'Dat05', 'Dat08', 'Dat10', 'Dat13', 'Dat15', 'Dat18', 'Dat20', 'Dat23', 'Dat25'];
          const aConvertData = _.chain(oReturnData)
            .pickBy((v, p) => _.startsWith(p, 'Dat'))
            .map((v, k) => ({ data: v, labelOrText: _.includes(aTextFields, k) ? 'text' : 'label' }))
            .value();

          oViewModel.setProperty('/employee/header/profilePath', _.isEmpty(Pturl) ? this.getUnknownAvatarImageURL() : Pturl);
          oViewModel.setProperty('/employee/header/baseInfo', aConvertData);
          // End 상단 프로필 Set

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

            aHeaderRequests.push(fCurriedGetEntitySet('EmpProfileHeaderTab', { Menuc: data.Menuc1, ...mFilters, Usrty }));
            aContentRequests.push(fCurriedGetEntitySet('EmpProfileContentsTab', { Menuc: data.Menuc1, ...mFilters, Usrty }));
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
          // End 탭 메뉴 Set

          // 2. Sub 영역 조회[header, contents]
          const aHeaderReturnData = Promise.all(aHeaderRequests);
          const aContentReturnData = Promise.all(aContentRequests);

          // Header 영역 Set
          (await aHeaderReturnData).forEach((headers, index) => {
            headers.forEach((o, i) => _.set(oViewModelData, ['employee', 'sub', aTabMenus[index].Menuc1, 'contents', o.Menuc, 'header', i], o));
          });
          // End Header 영역 Set

          // Contents 영역 Set
          (await aContentReturnData).forEach((content, index) => {
            content.forEach((o) => {
              let mSubMenu = _.get(oViewModelData, ['employee', 'sub', aTabMenus[index].Menuc1, 'contents', o.Menuc]);

              if (mSubMenu.type === this.SUB_TYPE.GRID) {
                _.times(mSubMenu.header.length, (i) => mSubMenu.data.push(o[`Value${_.padStart(i + 1, 2, '0')}`]));
              } else if (mSubMenu.type === this.SUB_TYPE.TABLE) {
                mSubMenu.data.push(o);
              }

              mSubMenu.rowCount = mSubMenu.data.length;
            });
          });
          // End Contents 영역 Set

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
        const aProfileTabItems = this.byId('profileTabBar').getItems();
        const aSubMenu = oViewModel.getProperty('/employee/sub');

        Object.keys(aSubMenu).forEach((sMenuKey) => {
          const aSubMenuContents = _.get(aSubMenu, [sMenuKey, 'contents']);
          const oTabContainer = _.find(aProfileTabItems, (o) => _.isEqual(o.getProperty('key'), sMenuKey));
          oTabContainer.destroyContent();

          let oWrapperVBox = sap.ui.getCore().byId(`sub${sMenuKey}`);

          if (oWrapperVBox) {
            oWrapperVBox.destroyItems();
            oParentBox.removeItem(oWrapperVBox);
          } else {
            oWrapperVBox = new sap.m.VBox({ id: `sub${sMenuKey}`, visible: true });
          }

          /**
           * OMenu.type: '5'  Table
           *      - 주소 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(aSubMenuContents).forEach((sKey) => {
            const mMenu = _.get(aSubMenuContents, sKey);
            const oSubVBox = new sap.m.VBox().addStyleClass('customBox sapUiMediumMarginBottom');
            const oSubHBox = new sap.m.HBox({ justifyContent: 'SpaceBetween' }).addStyleClass('table-toolbar');

            this.debug(`Sub ${mMenu.title}`, mMenu);

            // Title
            oSubHBox.addItem(new sap.m.Title({ level: 'H2', text: mMenu.title }));
            oSubVBox.addItem(oSubHBox);

            /**
             * Build Contents
             *  1. Table - 5
             *  2. Grid - 6
             */
            if (mMenu.type === this.SUB_TYPE.TABLE) {
              const sTableDataPath = `/employee/sub/${sMenuKey}/contents/${sKey}`;
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

              if (sMenuKey === 'M020') {
                // 인재육성위원회 row click
                oTable //
                  .setLayoutData(new FlexItemData({ styleClass: 'emp-profile-talent-dev' }))
                  .attachCellClick((oEvent) => {
                    const mRowData = oEvent.getParameter('rowBindingContext').getProperty();
                    this.openTalentDevDialog(mRowData);
                  });

                this.oTalentDevDialogHandler = new TalentDevDialogHandler(this);

                // 인재육성위원회 tab
                aVisibleHeaders.forEach((head, index) => {
                  const sValueField = `{Value${_.padStart(index + 1, 2, 0)}}`;
                  let oColumnTemplate;
                  if (['FILE1', 'FILE2', 'RESOL'].includes(head.Fieldname)) {
                    // icon column
                    oColumnTemplate = new sap.ui.core.Icon({
                      src: this.ICONS[head.Fieldname],
                      visible: head.Fieldname === 'RESOL' ? `{= \$${sValueField} === "X" }` : `{= Number(\$${sValueField}) > 0 }`,
                    });
                    if (head.Fieldname !== 'RESOL') {
                      oColumnTemplate
                        .setHoverColor('#007bff')
                        .addCustomData(new CustomData({ key: 'appno', value: `${sValueField}` })) //
                        .attachPress(this.onPressTalentDevFileDownload.bind(this));
                    }
                  } else {
                    // text column
                    oColumnTemplate = new sap.m.Text({
                      width: '100%', //
                      textAlign: _.isEmpty(head.Align) ? 'Center' : head.Align,
                      text: sValueField,
                    });
                  }
                  oTable.addColumn(
                    new sap.ui.table.Column({
                      width: _.isEqual(head.Width, '000') ? 'auto' : `${_.toNumber(head.Width)}%`,
                      label: new sap.m.Label({ text: head.Header }),
                      hAlign: sap.ui.core.HorizontalAlign.Center,
                      template: oColumnTemplate,
                    })
                  );
                });
              } else if (sMenuKey === 'M030') {
                oTable.addStyleClass('cell-bg');

                // Succession tab
                const aHeaderSpan = [1, 4, 1, 1, 1, 4, 1, 1, 1];
                const aSecondHeader = aVisibleHeaders.splice(aVisibleHeaders.length / 2);
                aVisibleHeaders.forEach((head, index) => {
                  const oColumnTemplate = new sap.m.Text({
                    width: '100%', //
                    textAlign: _.isEmpty(head.Align) ? 'Center' : head.Align,
                    text: {
                      path: `Value${_.padStart(index + 1, 2, 0)}`,
                      formatter: function (sValue) {
                        return (sValue || '').replace(/,/g, '\n');
                      },
                    },
                  });
                  if ((sKey === 'S031' && index > 4) || (sKey === 'S032' && index > 0 && index < 5)) {
                    oColumnTemplate.addCustomData(new CustomData({ key: 'bg', value: '{= ${Value10} === "X" ? "O" : "X" }', writeToDom: true }));
                  }
                  const oColumn = new sap.ui.table.Column({
                    width: _.isEqual(head.Width, '000') ? 'auto' : `${_.toNumber(head.Width)}%`,
                    multiLabels: [new sap.m.Label({ text: head.Header }), new sap.m.Label({ text: aSecondHeader[index].Header })],
                    headerSpan: aHeaderSpan[index],
                    template: oColumnTemplate,
                  });
                  oTable.addColumn(oColumn);
                });

                oTable.addEventDelegate(
                  {
                    onAfterRendering() {
                      this.$().find('[data-bg="O"]').parents('.sapUiTableCell').toggleClass('succession-bg-color', true);
                    },
                  },
                  oTable
                );
                this.TableUtils.adjustRowSpan({
                  oTable,
                  aColIndices: [0],
                  sTheadOrTbody: 'thead',
                });
                this.TableUtils.adjustRowSpan({
                  oTable,
                  aColIndices: [0, 1, 2, 3, 4],
                  sTheadOrTbody: 'tbody',
                });
              } else {
                aVisibleHeaders.forEach((head, index) => {
                  const oColumnTemplate = new sap.m.Text({
                    width: '100%', //
                    textAlign: _.isEmpty(head.Align) ? 'Center' : head.Align,
                    text: `{Value${_.padStart(index + 1, 2, 0)}}`,
                  });
                  oTable.addColumn(
                    new sap.ui.table.Column({
                      width: _.isEqual(head.Width, '000') ? 'auto' : `${_.toNumber(head.Width)}%`,
                      label: new sap.m.Label({ text: head.Header }),
                      template: oColumnTemplate,
                    })
                  );
                });
              }

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

      openTalentDevDialog(mRowData) {
        this.oTalentDevDialogHandler.openDialog(mRowData); // { Pernr, Gjahr, Mdate, Zseqnr }
      },

      async onPressTalentDevFileDownload(oEvent) {
        this.oTalentDevDialogHandler.onPressFileDownload(oEvent);
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
