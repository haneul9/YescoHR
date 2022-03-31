sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    Appno,
    AppUtils,
    ComboEntry,
    FileAttachmentBoxHandler,
    FragmentEvent,
    TextUtils,
    ServiceNames,
    ODataCreateError,
    ODataDeleteError,
    ODataReadError,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.CongDetail', {
      FileAttachmentBoxHandler: null,
      FragmentEvent: FragmentEvent,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          menuId: '',
          FormStatus: '',
          BirthMaxDate: moment().toDate(),
          FormData: {},
          benefitDate: '',
          Settings: {},
          BenefitType: [],
          BenefitCause: [],
          BenefitRelation: [],
          busy: false,
        };
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      async onObjectMatched(mArgs) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

        try {
          oDetailModel.setProperty('/FormStatus', mArgs.oDataKey);
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'ConExpenseAppl')));

          const aTypeCode = await this.getBenefitType();

          oDetailModel.setProperty('/BenefitType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aTypeCode }));
          oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));

          const oRowData = await this.getTargetData();

          if (oRowData) {
            oDetailModel.setProperty('/FormData', oRowData);
            oDetailModel.setProperty('/ApplyInfo', oRowData);
            oDetailModel.setProperty('/ApprovalDetails', oRowData);

            this.getBenefitData();
          }

          this.settingsAttachTable();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      formatFlowerTxt(vFlower) {
        return vFlower === undefined ? '' : vFlower === 'X' ? 'Y' : 'N';
      },

      // 상세조회
      getTargetData() {
        const oDetailModel = this.getViewModel();
        const sDataKey = oDetailModel.getProperty('/FormStatus');
        const sMenid = this.getCurrentMenuId();
        const mSessionData = this.getSessionData();
        const mAppointeeData = this.getAppointeeData();

        return new Promise((resolve, reject) => {
          oDetailModel.setProperty('/menuId', sMenid);

          if (!sDataKey || sDataKey === 'N') {
            oDetailModel.setProperty('/FormData', mSessionData);
            oDetailModel.setProperty('/FormData', {
              Apename: mSessionData.Ename,
              Appernr: mSessionData.Pernr,
              Ename: mAppointeeData.Ename,
              Pernr: mAppointeeData.Pernr,
              Concode: 'ALL',
              Conresn: 'ALL',
              Kdsvh: 'ALL',
            });

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });

            resolve();
          } else {
            const oModel = this.getModel(ServiceNames.BENEFIT);
            const sUrl = '/ConExpenseApplSet';

            oModel.read(sUrl, {
              filters: [
                new Filter('Prcty', FilterOperator.EQ, 'D'), // prettier 방지용 주석
                new Filter('Menid', FilterOperator.EQ, sMenid),
                new Filter('Appno', FilterOperator.EQ, sDataKey),
                new Filter('Pernr', FilterOperator.EQ, mAppointeeData.Pernr),
              ],
              success: (oData) => {
                resolve(oData.results[0]);
              },
              error: (oError) => {
                reject(new ODataReadError(oError));
              },
            });
          }
        });
      },

      // 경조유형
      getBenefitType() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oAppointeeData = this.getAppointeeData();

        return new Promise((resolve, reject) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new Filter('Cdnum', FilterOperator.EQ, 'BE0001'), // prettier 방지용 주석
              new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks),
              new Filter('Datum', FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              resolve(oData.results);
            },
            error: (oError) => {
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 전체list에 맞는코드 조회
      getBenefitData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const oAppointeeData = this.getAppointeeData();

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'BE0002'), // prettier 방지용 주석
            new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks),
            new Filter('Datum', FilterOperator.EQ, new Date()),
            new Filter('Upcod', FilterOperator.EQ, oFormData.Concode),
            new Filter('Upcod2', FilterOperator.EQ, 'E'),
            new Filter('Pernr', FilterOperator.EQ, oAppointeeData.Pernr),
          ],
          success: (oData) => {
            if (oData) {
              const aList = oData.results;

              oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'BE0003'), // prettier 방지용 주석
            new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks),
            new Filter('Datum', FilterOperator.EQ, new Date()),
            new Filter('Upcod', FilterOperator.EQ, oFormData.Concode),
            new Filter('Upcod2', FilterOperator.EQ, oFormData.Conresn),
          ],
          success: (oData) => {
            if (oData) {
              const oResult = oData.results;
              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: oResult }));
              oDetailModel.setProperty('/TargetList', []);

              if (!oFormData.ZappStatAl || oFormData.ZappStatAl === '10') {
                if (!!oResult[0] && oResult[0].Zcode === 'ME') {
                  this.onTargetDialog();
                  oRelationBtn.setVisible(false);
                  oRelationTxt.setEditable(false);
                  oBirthDatePicker.setEditable(false);
                } else {
                  oRelationBtn.setVisible(true);
                  oRelationTxt.setEditable(true);
                  oBirthDatePicker.setEditable(true);
                }
              }
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      // 경조유형 선택시
      onTypeChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const oAppointeeData = this.getAppointeeData();
        let sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Context', sSelectText);
        new Promise((resolve) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new Filter('Cdnum', FilterOperator.EQ, 'BE0002'), // prettier 방지용 주석
              new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks),
              new Filter('Datum', FilterOperator.EQ, new Date()),
              new Filter('Upcod', FilterOperator.EQ, sSelectKey),
              new Filter('Upcod2', FilterOperator.EQ, 'E'),
              new Filter('Pernr', FilterOperator.EQ, oAppointeeData.Pernr),
            ],
            success: (oData) => {
              if (oData) {
                const aList = oData.results;

                oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
                oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
                oDetailModel.setProperty('/FormData/Conresn', 'ALL');
                oDetailModel.setProperty('/FormData/Kdsvh', 'ALL');
              }

              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oRelationBtn.setVisible(true);
              oRelationTxt.setEditable(true);
              oBirthDatePicker.setEditable(true);
              oDetailModel.setProperty('/TargetList', []);
              oDetailModel.setProperty('/FormData/Zname', '');
              oDetailModel.setProperty('/FormData/Zbirthday', null);
              oDetailModel.setProperty('/FormData/Conddate', null);

              resolve();
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
            },
          });
        }).then(() => {
          this.getNomalPay();
        });
      },

      // 경조사유 선택시
      onCauseChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const sSelectText = oEvent.getSource().getSelectedItem().getText();
        const oAppointeeData = this.getAppointeeData();

        oDetailModel.setProperty('/FormData/Conretx', sSelectText);
        oDetailModel.setProperty(
          '/benefitDate',
          _.find(oDetailModel.getProperty('/BenefitCause'), (e) => {
            return sSelectKey === e.Zcode;
          }).Zchar1
        );
        this.getNomalPay(this);

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'BE0003'), // prettier 방지용 주석
            new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks),
            new Filter('Datum', FilterOperator.EQ, new Date()),
            new Filter('Upcod', FilterOperator.EQ, oFormData.Concode),
            new Filter('Upcod2', FilterOperator.EQ, sSelectKey),
          ],
          success: (oData) => {
            if (oData) {
              const oResult = oData.results;
              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oDetailModel.setProperty('/TargetList', []);
              oDetailModel.setProperty('/FormData/Zname', '');
              oDetailModel.setProperty('/FormData/Zbirthday', null);
              oDetailModel.setProperty('/FormData/Conddate', null);

              if (!oDetailModel.getProperty('/FormData/ZappStatAl') || oDetailModel.getProperty('/FormData/ZappStatAl') === '10') {
                if (!!oResult[0] && oResult[0].Zcode === 'ME') {
                  oDetailModel.setProperty('/BenefitRelation', oResult);
                  this.onTargetDialog();
                  oRelationBtn.setVisible(false);
                  oRelationTxt.setEditable(false);
                  oBirthDatePicker.setEditable(false);
                } else {
                  oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: oResult }));
                  oDetailModel.setProperty('/FormData/Kdsvh', 'ALL');
                  oRelationBtn.setVisible(true);
                  oRelationTxt.setEditable(true);
                  oBirthDatePicker.setEditable(true);
                }
              }
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      // 대상자 생년월일
      onBirthDate(oEvent) {
        const oDetailModel = this.getViewModel();
        const sAddDate = oDetailModel.getProperty('/benefitDate');

        if (!!sAddDate) {
          const dDate = moment(oEvent.getSource().getDateValue()).add('year', sAddDate).toDate();

          oDetailModel.setProperty('/FormData/Conddate', dDate);
          oDetailModel.setProperty('/FormData/Conrdate', dDate);
          this.getNomalPay();
        }
      },

      // 대상자 관계선택시
      onRelationChange(oEvent) {
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const oRelationBtn = this.byId('RelationBtn');
        const oRelationTxt = this.byId('RelationTxt');
        const oBirthDatePicker = this.byId('BirthDatePicker');

        oDetailModel.setProperty('/FormData/Kdsvh', sSelectKey);

        if (!!sSelectKey && sSelectKey === 'ME') {
          this.onTargetDialog();
          oRelationBtn.setVisible(false);
          oRelationTxt.setEditable(false);
          oBirthDatePicker.setEditable(false);
        } else {
          oDetailModel.setProperty('/FormData/Zbirthday', null);
          oDetailModel.setProperty('/FormData/Conddate', null);
          oDetailModel.setProperty('/FormData/Zname', '');
          oRelationBtn.setVisible(true);
          oRelationTxt.setEditable(true);
          oBirthDatePicker.setEditable(true);
        }
      },

      // 증빙상 경조일 선택시
      onBenefitChangeDate(oEvent) {
        this.getViewModel().setProperty('/FormData/Conrdate', oEvent.getSource().getDateValue());
        this.getNomalPay();
      },

      // 기본급, 지급율 등 받아옴
      getNomalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vConcode = oDetailModel.getProperty('/FormData/Concode');
        const vConresn = oDetailModel.getProperty('/FormData/Conresn');
        const vConddate = oDetailModel.getProperty('/FormData/Conddate');
        const oAppointeeData = this.getAppointeeData();

        if (!vConcode || !vConresn || !vConddate) return;

        oModel.read('/ConExpenseCheckListSet', {
          filters: [
            new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks), // prettier 방지용 주석
            new Filter('Pernr', FilterOperator.EQ, this.getAppointeeProperty('Pernr')),
            new Filter('Concode', FilterOperator.EQ, vConcode),
            new Filter('Conresn', FilterOperator.EQ, vConresn),
            new Filter('Conddate', FilterOperator.EQ, vConddate),
          ],
          success: (oData) => {
            if (oData) {
              const oPay = oData.results[0];

              oDetailModel.setProperty('/FormData/ZbacBet', oPay.ZbacBet);
              oDetailModel.setProperty('/FormData/ZbacBetT', oPay.ZbacBetT);
              oDetailModel.setProperty('/FormData/Payrt', oPay.Payrt);
              oDetailModel.setProperty('/FormData/PayrtT', oPay.PayrtT);
              oDetailModel.setProperty('/FormData/ZpayBetT', oPay.ZpayBetT);
              oDetailModel.setProperty('/FormData/ZpayBet', oPay.ZpayBet);
              oDetailModel.setProperty('/FormData/Zflower', oPay.Zflower);
              oDetailModel.setProperty('/FormData/Zemp', oPay.Zemp);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      // 대상자 성명 선택시
      async onTargetDialog() {
        const oDetailModel = this.getViewModel();

        // load asynchronous XML fragment
        if (!this.byId('targetSettingsDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.congratulation.fragment.TargetDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            await this.getTargetList();

            const oTargetData = oDetailModel.getProperty('/TargetList');

            if (oTargetData.length === 1 || oDetailModel.getProperty('/FormData/Kdsvh') === 'ME') return;

            if (oTargetData.length === 0) {
              return MessageBox.alert(this.getBundleText('MSG_03006'));
            }

            oDialog.open();
          });
        } else {
          await this.getTargetList();

          const oTargetData = oDetailModel.getProperty('/TargetList');

          if (oTargetData.length === 1 || oDetailModel.getProperty('/FormData/Kdsvh') === 'ME') return;

          if (oTargetData.length === 0) {
            return MessageBox.alert(this.getBundleText('MSG_03006'));
          }

          this.byId('targetSettingsDialog').open();
        }
      },

      // 대상자 리스트 조회
      getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const oAppointeeData = this.getAppointeeData();

        return new Promise((resolve) => {
          oModel.read('/ConExpenseSupportListSet', {
            filters: [
              new Filter('Werks', FilterOperator.EQ, oAppointeeData.Persa || oAppointeeData.Werks), // prettier 방지용 주석
              new Filter('Concode', FilterOperator.EQ, oFormData.Concode),
              new Filter('Conresn', FilterOperator.EQ, oFormData.Conresn),
              new Filter('Datum', FilterOperator.EQ, new Date()),
              new Filter('Pernr', FilterOperator.EQ, oAppointeeData.Pernr),
            ],
            success: (oData) => {
              if (oData) {
                const oTargetList = oData.results;
                const oChildList = [];

                oTargetList.forEach((e) => {
                  if (oTargetList.length !== 0 && (!oFormData.Kdsvh || oFormData.Kdsvh === e.Kdsvh)) {
                    oChildList.push(e);
                  }
                });

                if (oChildList.length === 1) {
                  oDetailModel.setProperty('/FormData/Zbirthday', oChildList[0].Zbirthday);
                  oDetailModel.setProperty('/FormData/Kdsvh', oChildList[0].Kdsvh);
                  oDetailModel.setProperty('/FormData/Zname', oChildList[0].Zname);

                  const sAddDate = oDetailModel.getProperty('/benefitDate');

                  if (!!sAddDate) {
                    const dDate = moment(oChildList[0].Zbirthday).add('year', sAddDate).toDate();

                    oDetailModel.setProperty('/FormData/Conddate', dDate);
                    oDetailModel.setProperty('/FormData/Conrdate', dDate);
                    this.getNomalPay();
                  }
                }

                oDetailModel.setProperty('/TargetList', oChildList);
                this.byId('targetTable').setVisibleRowCount(oChildList.length);
              }

              resolve();
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
            },
          });
        });
      },

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty(vPath);

        oDetailModel.setProperty('/FormData/Zbirthday', oRowData.Zbirthday);
        oDetailModel.setProperty('/FormData/Kdsvh', oRowData.Kdsvh);
        oDetailModel.setProperty('/FormData/Zname', oRowData.Zname);

        const sAddDate = oDetailModel.getProperty('/benefitDate');

        if (!!sAddDate) {
          const dDate = moment(oRowData.Zbirthday).add('year', sAddDate).toDate();

          oDetailModel.setProperty('/FormData/Conddate', dDate);
          oDetailModel.setProperty('/FormData/Conrdate', dDate);
          this.getNomalPay();
        }
        this.byId('targetSettingsDialog').close();
      },

      //  대상자 성명 Dialog 닫기클릭
      onClick() {
        this.byId('targetSettingsDialog').close();
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 경조유형
        if (oFormData.Concode === 'ALL' || !oFormData.Concode) {
          MessageBox.alert(this.getBundleText('MSG_02010'));
          return true;
        }

        // 경조사유
        if (oFormData.Conresn === 'ALL' || !oFormData.Conresn) {
          MessageBox.alert(this.getBundleText('MSG_02011'));
          return true;
        }

        // 대상자 관계
        if (oFormData.Kdsvh === 'ALL' || !oFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_02012'));
          return true;
        }

        // 대상자 생년월일
        if (!oFormData.Zbirthday) {
          MessageBox.alert(this.getBundleText('MSG_02006'));
          return true;
        }

        // 경조일
        if (!oFormData.Conddate) {
          MessageBox.alert(this.getBundleText('MSG_02007'));
          return true;
        }

        // 대상자 성명
        if (!oFormData.Zname) {
          MessageBox.alert(this.getBundleText('MSG_02008'));
          return true;
        }

        // 행사장소
        if (!oFormData.Zeloc) {
          MessageBox.alert(this.getBundleText('MSG_02009'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/ZappStatAl', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) {
          return;
        }

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00103'); // {저장}하시겠습니까?
        const sYes = this.getBundleText('LABEL_00103'); // 저장

        MessageBox.confirm(sMessage, {
          actions: [
            sYes,
            this.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: async (sAction) => {
            if (sAction !== sYes) {
              return;
            }

            const oDetailModel = this.getViewModel();

            try {
              AppUtils.setAppBusy(true, this);

              const mFormData = oDetailModel.getProperty('/FormData');
              const sAppno = mFormData.Appno;

              if (!sAppno) {
                const sAppno = await Appno.get();

                oDetailModel.setProperty('/FormData/Appno', sAppno);
                oDetailModel.setProperty('/FormData/ZappStatAl', '10');
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }

              // 파일 삭제 및 업로드
              const oError = await this.FileAttachmentBoxHandler.upload(mFormData.Appno);
              if (oError && oError.code === 'E') {
                throw oError;
              }

              await new Promise((resolve, reject) => {
                const oModel = this.getModel(ServiceNames.BENEFIT);
                const mPayload = {
                  ...mFormData,
                  Prcty: 'T',
                  Menid: oDetailModel.getProperty('/menuId'),
                  Waers: 'KRW',
                };

                oModel.create('/ConExpenseApplSet', mPayload, {
                  success: () => {
                    resolve();
                  },
                  error: (oError) => {
                    reject(new ODataCreateError({ oError }));
                  },
                });
              });

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError()) {
          return;
        }

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00121'); // {신청}하시겠습니까?
        const sYes = this.getBundleText('LABEL_00121'); // 신청

        MessageBox.confirm(sMessage, {
          actions: [
            sYes,
            this.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: async (sAction) => {
            if (sAction !== sYes) {
              return;
            }

            const oDetailModel = this.getViewModel();

            try {
              AppUtils.setAppBusy(true, this);

              const mFormData = oDetailModel.getProperty('/FormData');
              const sAppno = mFormData.Appno;

              if (!sAppno) {
                const sAppno = await Appno.get();

                oDetailModel.setProperty('/FormData/Appno', sAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }

              // 파일 삭제 및 업로드
              await this.FileAttachmentBoxHandler.upload(mFormData.Appno);

              await new Promise((resolve, reject) => {
                const oModel = this.getModel(ServiceNames.BENEFIT);
                const mPayload = {
                  ...mFormData,
                  Prcty: 'C',
                  Menid: oDetailModel.getProperty('/menuId'),
                  Waers: 'KRW',
                };

                oModel.create('/ConExpenseApplSet', mPayload, {
                  success: () => {
                    resolve();
                  },
                  error: (oError) => {
                    reject(new ODataCreateError({ oError }));
                  },
                });
              });

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              const mPayload = {
                ...oDetailModel.getProperty('/FormData'),
                Prcty: 'W',
                Menid: oDetailModel.getProperty('/menuId'),
              };

              oModel.create('/ConExpenseApplSet', mPayload, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.setAppBusy(false, this);
                  AppUtils.handleError(new ODataCreateError({ oError }));
                },
              });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (sAction) => {
            if (sAction && sAction === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/ConExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.setAppBusy(false, this);
                  AppUtils.handleError(new ODataDeleteError(oError));
                },
              });
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        this.FileAttachmentBoxHandler = new FileAttachmentBoxHandler(this, {
          editable: !sStatus || sStatus === '10',
          appno: sAppno,
          apptp: this.getApprovalType(),
          maxFileCount: 10,
          fileTypes: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'txt', 'bmp', 'gif', 'png', 'pdf'],
        });
      },
    });
  }
);
