sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/ui/core/CustomData',
    'sap/ui/core/Fragment',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/table/Table',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/talentDev/employeeView/TalentDevDialogHandler',
  ],
  (
    // prettier 방지용 주석
    FlexItemData,
    CustomData,
    Fragment,
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
          oViewModel.setProperty('/employee/sub', {});

          aTabMenus.forEach((data) => {
            this.debug(`Tab ${data.Menu1}`, data);

            _.set(oViewModelData, ['employee', 'sub', data.Menuc1], { contents: {} });

            aHeaderRequests.push(fCurriedGetEntitySet('EmpProfileHeaderTab', { Menuc: data.Menuc1, ...mFilters, Usrty }));
            aContentRequests.push(fCurriedGetEntitySet('EmpProfileContentsTab', { Menuc: data.Menuc1, ...mFilters, Usrty }));
          });

          aSubMenus.forEach((data) => {
            let mContentData;
            if (data.Menuc1 === 'M030') {
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
                rowCount: 1,
                selectionMode: 'None',
                title: data.Menu2,
                code: data.Menuc2,
                sort: data.Sorts,
                header: [],
                data: [],
              };
            }
            _.set(oViewModelData, ['employee', 'sub', data.Menuc1, 'contents', data.Menuc2], mContentData);
          });
          // End 탭 메뉴 Set

          // 2. Sub 영역 조회[header, contents]
          const aHeaderReturnData = Promise.all(aHeaderRequests);
          const aContentReturnData = Promise.all(aContentRequests);

          // Header 영역 Set
          (await aHeaderReturnData).forEach((headers, index) => {
            const sTabCode = aTabMenus[index].Menuc1;
            if (sTabCode === 'M030') {
              _.chain(oViewModelData)
                .get(['employee', 'sub', sTabCode, 'contents'])
                .defaultsDeep(
                  _.chain(headers) //
                    .filter((mHeader) => _.includes(['HEADER1_1', 'HEADER2_1', 'NTXPLN', 'TSCSPNT'], mHeader.Fieldname))
                    .reduce((acc, { Menuc, Fieldname, Header }) => _.defaultsDeep(acc, { [Menuc]: { label: { [Fieldname]: Header } } }), {})
                    .value()
                )
                .value();
            } else {
              headers.forEach((o, i) => _.set(oViewModelData, ['employee', 'sub', sTabCode, 'contents', o.Menuc, 'header', i], o));
            }
          });
          // End Header 영역 Set

          // Contents 영역 Set
          (await aContentReturnData).forEach((content, index) => {
            const sTabCode = aTabMenus[index].Menuc1;
            content.forEach((o) => {
              const mSubMenu = _.get(oViewModelData, ['employee', 'sub', sTabCode, 'contents', o.Menuc]);

              if (mSubMenu.type === this.SUB_TYPE.GRID) {
                _.times(mSubMenu.header.length, (i) => mSubMenu.data.push(o[`Value${_.padStart(i + 1, 2, '0')}`]));
              } else if (mSubMenu.type === this.SUB_TYPE.TABLE) {
                if (sTabCode === 'M030') {
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
                      .set('Ntxpln', mSubMenu.label.NTXPLN) // 차년도 계획
                      .set('Tscspnt', mSubMenu.label.TSCSPNT) // 승계예정시점
                      .set('nominees', [mNomineeData])
                      .value();
                    mSubMenu.data.push(mData);
                    mSubMenu.map[sPositionKey] = mData;
                  }
                } else {
                  mSubMenu.data.push(o);
                }
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
                  // 인재육성위원회 tab
                  this.addTalentDevTabContents(sKey, oTable, aVisibleHeaders);
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
              }
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

      addTalentDevTabContents(sKey, oTable, aVisibleHeaders) {
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
      },

      async addSuccessionTabContents(oSubVBox, sDataPath) {
        const oView = this.getView();
        const oSuccessionFragment = await Fragment.load({
          id: oView.getId(),
          name: `sap.ui.yesco.mvc.view.employee.fragment.Succession`,
          controller: this,
        });

        oSubVBox.addItem(
          new sap.m.HBox({
            width: '100%',
            items: [
              new sap.m.Title({
                text: '{label/HEADER1_1}',
                layoutData: new FlexItemData({ styleClass: 'succession-position' }),
              }), // 승계 대상
              new sap.m.Title({
                text: '{label/HEADER2_1}',
                layoutData: new FlexItemData({ styleClass: 'succession-nominees' }),
              }), // 승계 후보자
            ],
          }).bindElement(sDataPath)
        );
        oSubVBox.addItem(oSuccessionFragment.bindElement(sDataPath));
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
