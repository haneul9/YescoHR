sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    Fragment,
    BaseController,
    ServiceNames,
    EmpInfo,
    TableUtils
  ) => {
    'use strict';

    class Employee extends BaseController {
      constructor() {
        super();
        this.formatter = TableUtils;
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          navigation: {
            isShow: true,
            width: '20%',
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
            width: '80%',
            header: {
              baseinfo: [
                { data: '홍길순 부장/팀장' },
                { data: '회사' },
                { data: '예스코홀딩스' },
                { data: '그룹입사일' },
                { data: '2020.01.01(1년 11개월)' },
                { data: '010-1234-1234' },
                { data: '부서' },
                { data: '인사전략팀' },
                { data: '회사입사일' },
                { data: '2020.01.01(1년 11개월)' },
                { data: 'abc@yescoholdings.com' },
                { data: '사업장' },
                { data: '서울본사' },
                { data: '부서배치일' },
                { data: '2020.01.01(1년 11개월)' },
                { data: '1990.01.01 여(30세)' },
                { data: '직군' },
                { data: '일반직(연봉)' },
                { data: '직급승진일' },
                { data: '2020.01.01(1년 11개월)' },
                { data: '재직자 / 12345' },
                { data: '직무' },
                { data: '인사(1년 11개월)' },
                { data: '직책임용일' },
                { data: '2020.01.01(1년 11개월)' },
              ],
              timeline: [
                { label: '회사입사일', data: '2010.01.01' },
                { label: '부서배치일', data: '2015.01.01' },
                { label: '직급승진일', data: '2016.01.01' },
                { label: '직책임용일', data: '2010.01.01' },
                { label: '10년장기근속일', data: '2019.12.31' },
              ],
            },
            base: {
              isShow: true,
              extinfo1: [
                { data: '성명(영어)' }, //
                { data: 'GILSOON HONG' },
                { data: '성명(한자)' },
                { data: '洪吉順' },
                { data: '노조가입여부' },
                { data: '비조합원' },
                { data: '노조직책' },
                { data: '' },
                { data: '최종학력' },
                { data: '대학교 졸업' },
                { data: '입사시학력' },
                { data: '대학교 졸업' },
                { data: '퇴직일' },
                { data: '' },
                { data: '퇴직사유' },
                { data: '' },
              ],
              extinfo2: [
                { data: '실제생일' }, //
                { data: '1990.01.01' },
                { data: '음력/양력' },
                { data: '양력' },
                { data: '결혼여부' },
                { data: '기혼' },
                { data: '결혼기념일' },
                { data: '2020.01.01' },
                { data: '취미' },
                { data: '자전거' },
                { data: '특기' },
                { data: '골프' },
              ],
            },
            action: {
              isShow: false,
              rowcount: 3,
              listheader: [
                { width: '4%', label: 'No', property: 'idx' }, //
                { width: '12%', label: '발령', property: 'Todo1' },
                { width: '12%', label: '발령유형', property: 'Todo2' },
                { width: '12%', label: '발령사유', property: 'Todo3' },
                { width: '12%', label: '사업장', property: 'Todo4' },
                { width: '12%', label: '부서', property: 'Todo5' },
                { width: '12%', label: '직급', property: 'Todo6' },
                { width: '12%', label: '직책', property: 'Todo7' },
                { width: '12%', label: '사원유형', property: 'Todo8' },
              ],
              list: [
                { idx: '1', Todo1: '2020.01.01', Todo2: '조직개편', Todo3: '조직명칭변경', Todo4: '서울본사', Todo5: '인사팀', Todo6: '사원', Todo7: '팀원', Todo8: '일반직(연봉)' }, //
                { idx: '2', Todo1: '2020.01.01', Todo2: '조직개편', Todo3: '조직명칭변경', Todo4: '서울본사', Todo5: '인사팀', Todo6: '사원', Todo7: '팀원', Todo8: '일반직(연봉)' },
                { idx: '3', Todo1: '2020.01.01', Todo2: '조직개편', Todo3: '조직명칭변경', Todo4: '서울본사', Todo5: '인사팀', Todo6: '사원', Todo7: '팀원', Todo8: '일반직(연봉)' },
              ],
            },
            personal: {
              isShow: false,
              rowcount: 2,
              listheader: [
                { width: '10%', label: '유형', property: 'Todo1' }, //
                { width: '10%', label: '우편번호', property: 'Todo2' },
                { width: '80%', label: '주소', property: 'Todo3' },
              ],
              list: [
                { Todo1: '본적지', Todo2: '12345', Todo3: '서울시 중구 무교로 15 805호' }, //
                { Todo1: '본적지', Todo2: '12345', Todo3: '서울시 중구 무교로 15 805호' },
              ],
              address: {
                typelist: [
                  { key: '01', data: '본적지' }, //
                  { key: '02', data: '주민등록지' },
                ],
                sidolist: [
                  { key: '01', data: '서울특별시' }, //
                  { key: '02', data: '부산광역시' },
                  { key: '03', data: '경기도' },
                  { key: '04', data: '강원도' },
                ],
                form: {},
              },
            },
          },
        });
        // oViewModel.loadData('localService/attendancedata.json');
        this.setViewModel(oViewModel);
      }

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      onToggleNavigation(oEvent) {
        const bState = oEvent.getParameter('state');

        this.getView().getModel().setProperty('/navigation/isShow', bState);
        this.getView()
          .getModel()
          .setProperty('/navigation/width', bState ? '20%' : '4%');
        this.getView()
          .getModel()
          .setProperty('/employee/width', bState ? '80%' : '96%');
      }

      onClickEmployeeCard(oEvent) {
        const sPath = oEvent.getSource().getBindingContSext();
        MessageToast.show(`${sPath} Card click!!`);
      }

      onToggleProfile(oEvent) {
        const oClickedButton = oEvent.getSource();
        const sId = oClickedButton.getId();
        const bPressed = oClickedButton.getPressed();
        const oViewModel = this.getView().getModel();
        const aLayoutId = ['base', 'action', 'personal'];

        if (!bPressed) return;

        oClickedButton
          .getParent()
          .getItems()
          .forEach((control) => {
            control.setPressed(false);
          });
        oClickedButton.setPressed(true);

        aLayoutId.forEach((key) => {
          oViewModel.setProperty(`/employee/${key}/isShow`, sId.includes(key));
        });
      }

      openAddressDialog() {
        var oView = this.getView();

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
      }

      openModifyAddressDialog() {
        MessageBox.warning('준비중입니다.', { title: '경고' });
      }

      onDeleteAddress() {
        MessageBox.warning('준비중입니다.', { title: '경고' });
      }

      openSearchZipcodePopup() {
        window.open('postcodeForBrowser.html?CBF=fn_SetAddr', 'pop', 'width=550,height=550, scrollbars=yes, resizable=yes');
      }

      onAddressDialogClose() {
        this.byId('addressDialog').close();
      }
    }

    return Employee;
  }
);

// eslint-disable-next-line no-unused-vars
function fn_SetAddr(Zip, fullAddr) {
  const oView = sap.ui.getCore().byId('container-ehr---employee');
  const oViewModel = oView.getModel();

  oViewModel.setProperty('/employee/personal/address/form/zip', Zip);
  oViewModel.setProperty('/employee/personal/address/form/address1', fullAddr);
}
