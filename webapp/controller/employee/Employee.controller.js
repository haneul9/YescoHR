sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/table/Table',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/appUtils',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    Fragment,
    Table,
    CSSGrid,
    BaseController,
    ServiceNames,
    appUtils,
    EmpInfo,
    TableUtils,
    Validator,
    MessageBox
  ) => {
    'use strict';

    class Employee extends BaseController {
      constructor() {
        super();
        this.formatter = TableUtils;
        this.validator = Validator;
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          pernr: null,
          navigation: {
            current: '사원프로파일',
            links: [
              { name: '인사' }, //
            ],
          },
          sidenavigation: {
            isShow: true,
            width: '22%',
            search: {
              results: [
                { Ename: '김지현', Manager: true, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
                { Ename: '김지현', Manager: false, Todo1: '부장', Todo2: '팀장', Todo3: '예스코 기술연구소 정보기술팀', Todo4: '6년 11개월 (2015.01.01 입사) 재직', Todo5: '인사(5년 6개월)' },
              ],
            },
            treeData: [
              {
                ref: 'sap-icon://org-chart',
                title: '예스코홀딩스',
                Otype: 'O',
                Chief: '',
                Objid: '00000001',
                PupObjid: '00000000',
                nodes: [
                  {
                    ref: 'sap-icon://org-chart',
                    title: '인사팀',
                    Otype: 'O',
                    Chief: '',
                    Objid: '00000011',
                    PupObjid: '00000001',
                    nodes: [
                      {
                        ref: 'sap-icon://org-chart',
                        title: 'HRTF',
                        Otype: 'O',
                        Chief: '',
                        Objid: '00000013',
                        PupObjid: '00000011',
                        nodes: [
                          { ref: 'sap-icon://manager', title: '홍길동', Otype: 'P', Chief: 'X', Objid: '00000211', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000212', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000213', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000214', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000215', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000216', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000217', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000218', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000219', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000220', PupObjid: '00000013' },
                          { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000221', PupObjid: '00000013' },
                        ],
                      },
                      { ref: 'sap-icon://manager', title: '홍길동', Otype: 'P', Chief: 'X', Objid: '00000111', PupObjid: '00000011' },
                      { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000112', PupObjid: '00000011' },
                      { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000113', PupObjid: '00000011' },
                      { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000114', PupObjid: '00000011' },
                      { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000115', PupObjid: '00000011' },
                      { ref: 'sap-icon://employee', title: '홍길동', Otype: 'P', Chief: '', Objid: '00000116', PupObjid: '00000011' },
                    ],
                  },
                  {
                    ref: 'sap-icon://org-chart',
                    title: '기획팀',
                    Otype: 'O',
                    Chief: '',
                    Objid: '00000012',
                    PupObjid: '00000001',
                    nodes: [{ ref: 'sap-icon://manager', title: '홍길동', Otype: 'P', Chief: 'X', Objid: '00000222', PupObjid: '00000012' }],
                  },
                ],
              }, //
              {
                ref: 'sap-icon://org-chart',
                title: '예스코',
                Otype: 'O',
                Chief: '',
                Objid: '00000002',
                PupObjid: '00000000',
                nodes: [{ ref: 'sap-icon://manager', title: '홍길동', Otype: 'P', Chief: 'X', Objid: '00000223', PupObjid: '00000002' }],
              },
            ],
          },
          employee: {
            width: '78%',
            busy: true,
            header: {
              busy: true,
              profilepath: 'https://i1.wp.com/jejuhydrofarms.com/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png?ssl=1',
              baseinfo: [],
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
            address: {
              typelist: [{ Zcode: 'ALL', Ztext: this.getText('LABEL_00268') }],
              sidolist: [{ State: 'ALL', Bezei: this.getText('LABEL_00268') }],
              form: { Subty: 'ALL', State: 'ALL' },
            },
          },
        });
        this.setViewModel(oViewModel);

        const oRouter = this.getRouter();
        oRouter.getRoute('employee').attachPatternMatched(this.onObjectMatched, this);
      }

      onObjectMatched(oEvent) {
        const oParameter = oEvent.getParameter('arguments');
        const oViewModel = this.getView().getModel();
        const sPernr = oParameter.pernr || null;

        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.loadProfile({ oViewModel, sPernr });
        this.readTypeList();
        this.readCityList();
      }

      loadProfile({ oViewModel, sPernr }) {
        const oModel = this.getModel(ServiceNames.PA);
        const aFilters = [];

        if (sPernr) {
          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        Promise.all([
          this.readEmpProfileHeaderNew({ oModel, oViewModel, aFilters }), //
          this.readEmpProfileMenu({ oModel, oViewModel, aFilters }),
        ]).then((returnData) => {
          const mTabMenu = returnData[1];
          let aHeaderRequests = [];
          let aContentRequests = [];

          mTabMenu.map((data) => {
            aHeaderRequests.push(this.readEmpProfileHeaderTab({ oModel, aFilters: [new Filter('Menuc', FilterOperator.EQ, data.Menuc1), ...aFilters] }));
            aContentRequests.push(this.readEmpProfileContentsTab({ oModel, aFilters: [new Filter('Menuc', FilterOperator.EQ, data.Menuc1), ...aFilters] }));
          });

          Promise.all(aHeaderRequests)
            .then((returnHeaderData) => {
              Promise.all(aContentRequests)
                .then((returnContentData) => {
                  const oViewModelData = oViewModel.getData();

                  returnHeaderData.forEach((headers, index) => {
                    headers.forEach((o) => {
                      oViewModelData.employee.sub[mTabMenu[index]?.Menuc1]?.contents[o.Menuc]?.header.push(o);
                    });
                  });

                  returnContentData.forEach((content, index) => {
                    content.forEach((o) => {
                      let oSubMenu = oViewModelData.employee.sub[mTabMenu[index]?.Menuc1]?.contents[o.Menuc];

                      if (oSubMenu.type === '6') {
                        for (let i = 1; i <= oSubMenu.header.length; i++) {
                          let sKey = `Value${_.padStart(i, 2, '0')}`;
                          oSubMenu.data.push(o[sKey]);
                        }
                      } else if (oSubMenu.type === '5') {
                        oSubMenu.data.push(o);
                      }

                      oSubMenu.rowcount = oSubMenu.data.length;
                    });
                  });

                  oViewModel.setData(oViewModelData);

                  this.makeProfileBody();
                  oViewModel.setProperty('/employee/busy', false);
                })
                .catch((error) => {
                  this.debug(error);
                  oViewModel.setProperty('/employee/busy', false);
                  MessageBox.error(this.getText('MSG_00008', '조회'));
                });
            })
            .catch((error) => {
              this.debug(error);
              oViewModel.setProperty('/employee/busy', false);
              MessageBox.error(this.getText('MSG_00008', '조회'));
            });
        });
      }

      makeProfileBody() {
        const oView = this.getView().getModel();
        const oParentBox = this.byId('profileBody');
        const mSubMenu = oView.getProperty('/employee/sub');

        Object.keys(mSubMenu).forEach((menukey) => {
          let mSubMenuContents = mSubMenu[menukey].contents;
          let oVBox = new sap.m.VBox({ id: `sub${menukey}`, visible: { path: `/employee/sub/${menukey}/isShow` } });

          Object.keys(mSubMenuContents).forEach((key) => {
            let oMenu = mSubMenuContents[key];
            let oSubVBox = new sap.m.VBox().addStyleClass('customBox');
            let oSubHBox = new sap.m.HBox({ justifyContent: 'SpaceBetween' });
            this.debug('oMenu', oMenu);

            oSubHBox.addItem(new sap.m.Title({ level: 'H2', text: oMenu.title }));
            if (oMenu.title === '주소') {
              let oSubButtonBox = new sap.m.HBox();

              oSubButtonBox.addItem(new sap.m.Button({ type: 'Transparent', icon: 'sap-icon://edit', text: '수정', press: this.onPressModifyAddress.bind(this) }));
              oSubButtonBox.addItem(new sap.m.Button({ type: 'Transparent', icon: 'sap-icon://add', text: '추가', press: this.onPressRegAddress.bind(this) }));
              oSubButtonBox.addItem(new sap.m.Button({ type: 'Transparent', icon: 'sap-icon://less', text: '삭제', press: this.onPressDeleteAddress.bind(this) }));
              oSubHBox.addItem(oSubButtonBox);
            }

            oSubVBox.addItem(oSubHBox);

            // Table
            if (oMenu.type === '5') {
              let oTable = new Table({
                width: '100%',
                selectionMode: { path: `/employee/sub/${menukey}/contents/${key}/selectionMode` },
                visibleRowCount: { path: `/employee/sub/${menukey}/contents/${key}/rowcount` },
                noData: this.getText('MSG_00001'),
              }).bindRows(`/employee/sub/${menukey}/contents/${key}/data`);

              oMenu.header.forEach((head, index) => {
                if (!head.Invisible) {
                  let oColumn = new sap.ui.table.Column({ width: 'auto' });

                  oColumn.setLabel(new sap.m.Label({ text: head.Header }));
                  oColumn.setTemplate(new sap.m.Text({ width: '100%', textAlign: 'Center', text: { path: `Value${_.padStart(index + 1, 2, '0')}` } }));
                  oTable.addColumn(oColumn);
                }
              });

              oSubVBox.addItem(oTable);
              // Grid
            } else if (oMenu.type === '6') {
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
      }

      openAddressDialog() {
        const oView = this.getView();

        appUtils.setAppBusy(true, this);

        setTimeout(() => {
          if (!this._pAddressDialog) {
            this._pAddressDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.view.employee.fragment.AddressDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this._pAddressDialog.then(function (oDialog) {
            oDialog.open();
          });
        }, 100);
      }

      async refreshAddress({ oViewModel }) {
        const oMenuInfo = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menu2: '주소' });
        const sAddressPath = `/employee/sub/${oMenuInfo.Menuc1}/contents/${oMenuInfo.Menuc2}`;
        const mReturnContents = await this.readEmpProfileContentsTab({
          oModel: this.getModel(ServiceNames.PA),
          aFilters: [
            new Filter('Pernr', FilterOperator.EQ, oMenuInfo.Pernr), //
            new Filter('Menuc', FilterOperator.EQ, oMenuInfo.Menuc1),
          ],
        });
        const mTableData = _.filter(mReturnContents, { Menuc: oMenuInfo.Menuc2 });

        oViewModel.setProperty(`${sAddressPath}/data`, mTableData);
        oViewModel.setProperty(`${sAddressPath}/rowcount`, mTableData.length);
      }

      getAddressTableRowdata({ oViewModel, oTable, aSelectedIndices }) {
        const sRowPath = oTable.getRows()[aSelectedIndices[0]].getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(sRowPath);
        const oMenu = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menuc2: oRowData.Menuc });
        const mHeaderData = oViewModel.getProperty(`/employee/sub/${oMenu.Menuc1}/contents/${oMenu.Menuc2}/header`);

        return {
          Pernr: oRowData.Pernr,
          Subty: oRowData[`Value${_.padStart(_.findIndex(mHeaderData, { Fieldname: 'SUBTY' }) + 1, 2, '0')}`],
          Begda: oRowData[`Value${_.padStart(_.findIndex(mHeaderData, { Fieldname: 'BEGDA' }) + 1, 2, '0')}`],
        };
      }

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      onToggleNavigation(oEvent) {
        const bState = oEvent.getParameter('state');

        this.getView().getModel().setProperty('/sidenavigation/isShow', bState);
        this.getView()
          .getModel()
          .setProperty('/sidenavigation/width', bState ? '22%' : '4%');
        this.getView()
          .getModel()
          .setProperty('/employee/width', bState ? '78%' : '96%');
      }

      onClickEmployeeCard(oEvent) {
        const sPath = oEvent.getSource().getBindingContSext();
        MessageToast.show(`${sPath} Card click!!`);
      }

      onToggleTab(oEvent) {
        const oClickedButton = oEvent.getSource();
        const sMenuCode = oClickedButton.getCustomData()[0].getValue();
        const bPressed = oClickedButton.getPressed();
        const oViewModel = this.getView().getModel();

        if (!bPressed) return;

        oClickedButton
          .getParent()
          .getItems()
          .forEach((control) => {
            const sMenuc = control.getCustomData()[0].getValue();

            control.setPressed(false);
            oViewModel.setProperty(`/employee/sub/${sMenuc}/isShow`, false);
          });
        oClickedButton.setPressed(true);
        oViewModel.setProperty(`/employee/sub/${sMenuCode}/isShow`, true);
      }

      onPressRegAddress() {
        const oViewModel = this.getView().getModel();

        oViewModel.setProperty('/employee/address/actionText', '추가');
        oViewModel.setProperty('/employee/address/form', { Subty: 'ALL', State: 'ALL' });

        this.openAddressDialog();
      }

      async onSaveAddress() {
        const oViewModel = this.getView().getModel();
        const oInputData = oViewModel.getProperty('/employee/address/form');
        const sActionText = oViewModel.getProperty('/employee/address/actionText');
        const mCheckFields = [
          { field: 'Subty', label: '주소유형', type: Validator.SELECT1 }, //
          { field: 'Begda', label: '적용시작일', type: Validator.INPUT1 },
          { field: 'State', label: '시/도', type: Validator.SELECT2 },
          { field: 'Pstlz', label: '우편번호', type: Validator.INPUT2 },
          { field: 'Zzaddr2', label: '상세주소', type: Validator.INPUT2 },
        ];

        if (!this.validator.check.call(this, { oInputData, mCheckFields })) return;

        const oSido = _.find(oViewModel.getProperty('/employee/address/sidolist'), { State: oInputData.State });
        delete oSido.Land1;
        delete oSido.__metadata;

        const { result } = await this.createAddressInfo({ oInputData: { ...oSido, ...oInputData } });

        if (result === 'success') {
          MessageBox.success(this.getText('MSG_00007', sActionText));

          this.refreshAddress({ oViewModel });
        } else {
          MessageBox.error(this.getText('MSG_00008', sActionText));
        }

        this.onAddressDialogClose();
      }

      async onPressModifyAddress(oEvent) {
        const oViewModel = this.getView().getModel();
        const oTable = oEvent.getSource().getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getText('MSG_00010', '수정'));
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert('수정할 데이터를 하나만 선택하세요.');
          return;
        }

        const oPayload = this.getAddressTableRowdata({ oViewModel, oTable, aSelectedIndices });
        const oAddressDetail = await this.readAddressInfo({ oPayload });

        if (oAddressDetail.result === 'error') {
          MessageBox.error(this.getText('MSG_00008', '상세조회'));
          return;
        }

        oViewModel.setProperty('/employee/address/actionText', '수정');
        oViewModel.setProperty('/employee/address/form', oAddressDetail.result);

        this.openAddressDialog(oEvent);
        oTable.clearSelection();
      }

      onPressDeleteAddress(oEvent) {
        const oViewModel = this.getView().getModel();
        const oTable = oEvent.getSource().getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getText('MSG_00010', '삭제'));
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert('삭제할 데이터를 하나만 선택하세요.');
          return;
        }

        appUtils.setAppBusy(true, this);

        MessageBox.confirm(this.getText('MSG_00006', '삭제'), {
          actions: ['삭제', MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (sAction === MessageBox.Action.CANCEL) return;

            const oPayload = this.getAddressTableRowdata({ oViewModel, oTable, aSelectedIndices });
            const { result } = await this.deleteAddressInfo({ oPayload });

            if (result === 'success') {
              MessageBox.success(this.getText('MSG_00007', '삭제'));
            } else {
              appUtils.setAppBusy(false, this);
              MessageBox.error(this.getText('MSG_00008', '삭제'));
              return;
            }

            this.refreshAddress({ oViewModel });

            oTable.clearSelection();
            appUtils.setAppBusy(false, this);
          },
        });
      }

      openSearchZipcodePopup() {
        window.open('postcodeForBrowser.html?CBF=fn_SetAddr', 'pop', 'width=550,height=550, scrollbars=yes, resizable=yes');
      }

      onAddressDialogClose() {
        appUtils.setAppBusy(false, this);
        this.byId('addressDialog').close();
      }

      /*****************************************************************
       * Call oData
       *****************************************************************/
      readEmpProfileMenu({ oModel, oViewModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileMenuSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              const aToggleButtons = _.filter(oData.results, { Child: '1' }).map((obj, index) => ({ Pressed: index === 0, ...obj }));
              oViewModel.setProperty('/employee/tab/list', aToggleButtons);
              const aSubMenus = oData.results.filter((data) => data.Child !== '1');
              oViewModel.setProperty('/employee/tab/menu', aSubMenus);

              // Model 초기화
              const oViewModelData = oViewModel.getData();
              aToggleButtons.forEach((data) => {
                oViewModelData.employee.sub[data.Menuc1] = { isShow: data.Pressed, contents: {} };
              });
              aSubMenus.forEach((data) => {
                oViewModelData.employee.sub[data.Menuc1].contents[data.Menuc2] = {
                  type: data.Child,
                  rowcount: 1,
                  selectionMode: data.Menu2 === '주소' ? 'MultiToggle' : 'None',
                  title: data.Menu2,
                  sort: data.Sorts,
                  header: [],
                  data: [],
                };
              });
              oViewModel.setData(oViewModelData);

              resolve(aToggleButtons);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject();
            },
          });
        });
      }

      readEmpProfileHeaderNew({ oModel, oViewModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileHeaderNewSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              const { Pturl, ...oReturnData } = oData.results[0];
              delete oReturnData.Pernr;
              delete oReturnData.Langu;
              delete oReturnData.Prcty;
              delete oReturnData.Actty;
              delete oReturnData.__metadata;
              const aConvertData = Object.keys(oReturnData).map((key) => ({ data: oReturnData[key] }));

              oViewModel.setProperty('/employee/header/profilepath', Pturl);
              oViewModel.setProperty('/employee/header/baseinfo', aConvertData);
              oViewModel.setProperty('/employee/header/busy', false);

              resolve();
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject();
            },
          });
        });
      }

      readEmpProfileHeaderTab({ oModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileHeaderTabSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              reject();
            },
          });
        });
      }

      readEmpProfileContentsTab({ oModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileContentsTabSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              reject();
            },
          });
        });
      }

      readTypeList() {
        const oModel = this.getModel(ServiceNames.PA);
        const oViewModel = this.getViewModel();
        const sUrl = '/PaCodeListSet';
        const mTypeList = oViewModel.getProperty('/employee/address/typelist');

        if (mTypeList.length > 1) return;

        oModel.read(sUrl, {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'CM0002'), //
            new Filter('Grcod', FilterOperator.EQ, '0006'),
          ],
          success: (oData) => {
            this.debug(`${sUrl} success.`, oData);
            oViewModel.setProperty('/employee/address/typelist', [...mTypeList, ...oData.results]);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
          },
        });
      }

      readCityList() {
        const oModel = this.getModel(ServiceNames.PA);
        const oViewModel = this.getViewModel();
        const sUrl = '/CityListSet';
        const sPernr = oViewModel.getProperty('/pernr');
        const mSidoList = oViewModel.getProperty('/employee/address/sidolist');
        let aFilters = [];

        if (mSidoList.length > 1) return;

        if (sPernr) {
          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read(sUrl, {
          filters: aFilters,
          success: (oData) => {
            this.debug(`${sUrl} success.`, oData);
            oViewModel.setProperty('/employee/address/sidolist', [...mSidoList, ...oData.results]);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
          },
        });
      }

      readAddressInfo({ oPayload }) {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sUrl = '/AddressInfoSet';

          oPayload.Begda = moment(oPayload.Begda).hour(9).toDate();

          oModel.read(sUrl, {
            filters: Object.keys(oPayload).map((field) => {
              return new Filter(field, FilterOperator.EQ, oPayload[field]);
            }),
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              resolve({ result: oData.results[0] });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              resolve({ result: 'error' });
            },
          });
        });
      }

      createAddressInfo({ oInputData }) {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sUrl = '/AddressInfoSet';

          oInputData.Begda = moment(oInputData.Begda).hour(9).toDate();

          oModel.create(sUrl, oInputData, {
            success: () => {
              resolve({ result: 'success' });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              resolve({ result: 'error' });
            },
          });
        });
      }

      deleteAddressInfo({ oPayload }) {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.PA);

          oPayload.Begda = moment(oPayload.Begda).hour(9).toDate();

          const sUrl = oModel.createKey('/AddressInfoSet', oPayload);

          oModel.remove(sUrl, {
            success: () => {
              resolve({ result: 'success' });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              resolve({ result: 'error' });
            },
          });
        });
      }
    }

    return Employee;
  }
);

// eslint-disable-next-line no-unused-vars
function fn_SetAddr(Zip, fullAddr) {
  const oView = sap.ui.getCore().byId('container-ehr---employee');
  const oViewModel = oView.getModel();

  oViewModel.setProperty('/employee/address/form/Pstlz', Zip);
  oViewModel.setProperty('/employee/address/form/Zzaddr1', fullAddr);
}
