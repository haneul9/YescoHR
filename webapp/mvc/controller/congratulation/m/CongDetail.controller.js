sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    TextUtils,
    FragmentEvent,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.m.CongDetail', {
      AttachFileAction: AttachFileAction,
      FragmentEvent: FragmentEvent,
      TextUtils: TextUtils,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          menuId: '',
          FormStatus: '',
          FormData: {},
          Settings: {},
          BenefitType: [],
          BenefitCause: [],
          BenefitRelation: [],
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
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

        try {
          oDetailModel.setProperty('/FormStatus', mArgs.oDataKey);

          const aTypeCode = await this.getBenefitType();

          oDetailModel.setProperty('/BenefitType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aTypeCode }));
          oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oDetailModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));

          const oRowData = await this.getTargetData();

          if (!!oRowData) {
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

        return new Promise((resolve, reject) => {
          oDetailModel.setProperty('/menuId', sMenid);

          if (!sDataKey || sDataKey === 'N') {
            oDetailModel.setProperty('/FormData', mSessionData);
            oDetailModel.setProperty('/FormData', {
              Apename: mSessionData.Ename,
              Appernr: mSessionData.Pernr,
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
                new Filter('Prcty', FilterOperator.EQ, 'D'), //
                new Filter('Menid', FilterOperator.EQ, sMenid),
                new Filter('Appno', FilterOperator.EQ, sDataKey),
              ],
              success: (oData) => {
                resolve(oData.results[0]);
              },
              error: (oError) => {
                reject(oError);
              },
            });
          }
        });
      },

      // 경조유형
      getBenefitType() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sWerks = this.getSessionProperty('Werks');

        return new Promise((resolve, reject) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new Filter('Cdnum', FilterOperator.EQ, 'BE0001'), //
              new Filter('Werks', FilterOperator.EQ, sWerks),
              new Filter('Datum', FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              resolve(oData.results);
            },
            error: (oError) => {
              reject(oError);
            },
          });
        });
      },

      // 전체list에 맞는코드 조회
      getBenefitData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sWerks = this.getSessionProperty('Werks');

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'BE0002'), //
            new Filter('Werks', FilterOperator.EQ, sWerks),
            new Filter('Datum', FilterOperator.EQ, new Date()),
            new Filter('Upcod', FilterOperator.EQ, oFormData.Concode),
            new Filter('Upcod2', FilterOperator.EQ, 'E'),
          ],
          success: (oData) => {
            if (oData) {
              const aList = oData.results;

              oDetailModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
            }
          },
          error: (oError) => {
            AppUtils.handleError(oError);
          },
        });

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'BE0003'), //
            new Filter('Werks', FilterOperator.EQ, sWerks),
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
            AppUtils.handleError(oError);
          },
        });
      },

      // 경조유형 선택시
      onTypeChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const sWerks = this.getSessionProperty('Werks');
        let sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Context', sSelectText);

        new Promise((resolve) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new Filter('Cdnum', FilterOperator.EQ, 'BE0002'), //
              new Filter('Werks', FilterOperator.EQ, sWerks),
              new Filter('Datum', FilterOperator.EQ, new Date()),
              new Filter('Upcod', FilterOperator.EQ, sSelectKey),
              new Filter('Upcod2', FilterOperator.EQ, 'E'),
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

              resolve();
            },
            error: (oError) => {
              AppUtils.handleError(oError);
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
        const sWerks = this.getSessionProperty('Werks');

        oDetailModel.setProperty('/FormData/Conretx', sSelectText);

        this.getNomalPay(this);

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new Filter('Cdnum', FilterOperator.EQ, 'BE0003'), //
            new Filter('Werks', FilterOperator.EQ, sWerks),
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
            AppUtils.handleError(oError);
          },
        });
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
        const sWerks = this.getSessionProperty('Werks');

        if (!vConcode || !vConresn || !vConddate) return;

        oModel.read('/ConExpenseCheckListSet', {
          filters: [
            new Filter('Werks', FilterOperator.EQ, sWerks), //
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
            AppUtils.handleError(oError);
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
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
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
        const sWerks = this.getSessionProperty('Werks');

        return new Promise((resolve) => {
          oModel.read('/ConExpenseSupportListSet', {
            filters: [
              new Filter('Werks', FilterOperator.EQ, sWerks), //
              new Filter('Concode', FilterOperator.EQ, oFormData.Concode),
              new Filter('Conresn', FilterOperator.EQ, oFormData.Conresn),
              new Filter('Datum', FilterOperator.EQ, new Date()),
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
                }

                oDetailModel.setProperty('/TargetList', oChildList);
                this.byId('targetTable').setVisibleRowCount(oChildList.length);
              }

              resolve();
            },
            error: (oError) => {
              AppUtils.handleError(oError);
            },
          });
        });
      },

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty(vPath);

        oDetailModel.setProperty('/FormData/Zbirthday', oRowData.Zbirthday);
        oDetailModel.setProperty('/FormData/Kdsvh', oRowData.Kdsvh);
        oDetailModel.setProperty('/FormData/Zname', oRowData.Zname);
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
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sAppno = oFormData.Appno;

        if (this.checkError(this)) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/ZappStatAl', '10');
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/menuId');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.APPTP);

                await new Promise((resolve, reject) => {
                  oModel.create('/ConExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(oError);
                    },
                  });
                });
                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const sAppno = oFormData.Appno;

        if (this.checkError(this)) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/menuId');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.APPTP);
                await new Promise((resolve, reject) => {
                  oModel.create('/ConExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(oError);
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.getRouter().navTo('congratulation');
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
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

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Menid = oDetailModel.getProperty('/menuId');

              oModel.create('/ConExpenseApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.getRouter().navTo('congratulation');
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.setAppBusy(false, this);
                  AppUtils.handleError(oError);
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
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/ConExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getRouter().navTo('congratulation');
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.setAppBusy(false, this);
                  AppUtils.handleError(oError);
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

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.APPTP,
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
