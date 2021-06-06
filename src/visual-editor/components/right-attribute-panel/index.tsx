/**
 * @name: RightAttributePanel
 * @author: 卜启缘
 * @date: 2021/4/28 16:59
 * @description：属性编辑器
 * @update: 2021/4/28 16:59
 */
import { defineComponent, reactive } from 'vue'
import styles from './index.module.scss'
import './index.common.scss'
import {
  ElColorPicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElPopover
} from 'element-plus'
import { VisualEditorProps, VisualEditorPropsType } from '@/visual-editor/visual-editor.props'
import { TablePropEditor } from './components/'
import MonacoEditor from '../common/monaco-editor/MonacoEditor'
import { useDotProp } from '@/visual-editor/hooks/useDotProp'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'

export default defineComponent({
  name: 'RightAttributePanel',
  setup() {
    const { visualConfig, currentBlock } = useVisualData()

    const state = reactive({
      activeName: 'attr',
      isOpen: true
    })

    const renderEditor = (propName: string, propConfig: VisualEditorProps) => {
      const { propObj, prop } = useDotProp(currentBlock.value.props, propName)

      return {
        [VisualEditorPropsType.input]: () => (
          <ElInput v-model={propObj[prop]} placeholder={propConfig.tips || propConfig.label} />
        ),
        [VisualEditorPropsType.inputNumber]: () => <ElInputNumber v-model={propObj[prop]} />,
        [VisualEditorPropsType.switch]: () => <ElSwitch v-model={propObj[prop]} />,
        [VisualEditorPropsType.color]: () => <ElColorPicker v-model={propObj[prop]} />,
        [VisualEditorPropsType.select]: () => (
          <ElSelect v-model={propObj[prop]} valueKey={'value'} multiple={propConfig.multiple}>
            {(() => {
              return propConfig.options!.map((opt) => (
                <ElOption label={opt.label} value={opt.value} />
              ))
            })()}
          </ElSelect>
        ),
        [VisualEditorPropsType.table]: () => (
          <TablePropEditor v-model={propObj[prop]} propConfig={propConfig} />
        )
      }[propConfig.type]()
    }

    return () => {
      const content: JSX.Element[] = []

      if (!currentBlock.value) {
        content.push(
          <>
            <ElFormItem label="容器宽度">
              <ElInputNumber v-model={currentBlock.value.width} {...({ step: 100 } as any)} />
            </ElFormItem>
            <ElFormItem label="容器高度">
              <ElInputNumber v-model={currentBlock.value.height} {...({ step: 100 } as any)} />
            </ElFormItem>
          </>
        )
      } else {
        const { componentKey } = currentBlock.value
        const component = visualConfig.componentMap[componentKey]
        console.log('props.block:', currentBlock.value)
        content.push(
          <ElFormItem label="组件ID" labelWidth={'76px'}>
            {currentBlock.value._vid}
            <ElPopover
              width={200}
              trigger="hover"
              content={`你可以利用该组件ID。对该组件进行获取和设置其属性，组件可用属性可在控制台输入：$$refs.${currentBlock.value._vid} 进行查看`}
            >
              {{
                reference: () => (
                  <i style={{ marginLeft: '6px' }} class={'el-icon-warning-outline'}></i>
                )
              }}
            </ElPopover>
          </ElFormItem>
        )
        if (!!component) {
          if (!!component.props) {
            content.push(
              ...Object.entries(component.props || {}).map(([propName, propConfig]) => (
                <ElFormItem
                  key={currentBlock.value._vid + propName}
                  v-slots={{
                    label: () =>
                      propConfig.tips ? (
                        <>
                          <ElPopover width={200} trigger={'hover'} content={propConfig.tips}>
                            {{
                              reference: () => <i class={'el-icon-warning-outline'}></i>
                            }}
                          </ElPopover>
                          {propConfig.label}
                        </>
                      ) : (
                        propConfig.label
                      )
                  }}
                >
                  {renderEditor(propName, propConfig)}
                </ElFormItem>
              ))
            )
          }
        }
      }

      const handleSchemaChange = (val) => {
        try {
          const newObj = JSON.parse(val)
          Object.assign(currentBlock.value, newObj)
        } catch (e) {
          console.log('JSON格式有误：', e)
        }
      }

      return (
        <>
          <div class={[styles.drawer, { [styles.isOpen]: state.isOpen }]}>
            <div class={styles.floatingActionBtn} onClick={() => (state.isOpen = !state.isOpen)}>
              <i class={`el-icon-d-arrow-${state.isOpen ? 'right' : 'left'}`}></i>
            </div>
            <div class={styles.attrs}>
              <ElTabs v-model={state.activeName}>
                <ElTabPane label="属性面板" name="attr">
                  <ElForm size="mini" label-position="left">
                    {content}
                  </ElForm>
                </ElTabPane>
                <ElTabPane label="JSON" name="json" lazy>
                  <MonacoEditor
                    code={JSON.stringify(currentBlock.value)}
                    layout={{ width: 300, height: 800 }}
                    vid={state.activeName == 'json' ? currentBlock.value._vid : -1}
                    onChange={handleSchemaChange}
                    title=""
                  />
                </ElTabPane>
              </ElTabs>
            </div>
          </div>
        </>
      )
    }
  }
})
