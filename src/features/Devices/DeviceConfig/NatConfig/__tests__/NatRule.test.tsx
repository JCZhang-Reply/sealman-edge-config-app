import { render } from "@/utils/test-utils"
import NatRule from "../NatRule"
import userEvent from "@testing-library/user-event"
import { DeviceNatConfigRulesContext } from "../context"
import { ctx } from "../__mocks__/context"


describe("NatRule", () => {
  it("should display name extIp and intIp received as props", () => {
    const { getByDisplayValue }  = render(<NatRule index={1} rule={
      {
        extIp: "extIp",
        intIp: "intIp",
        name: "name"
      }
    }/>)

    getByDisplayValue("extIp")
    getByDisplayValue("intIp")
    getByDisplayValue("name")
  })

  it("should call updateRule from the provider upon input name change", async () => {
    const user = userEvent.setup()
    const { getByLabelText }  = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <NatRule index={0} rule={
          {
            extIp: "extIp",
            intIp: "intIp",
            name: "name"
          }
        }/>
      </DeviceNatConfigRulesContext.Provider>
      )

    await user.type(getByLabelText("Name"), "X")
    await user.type(getByLabelText("External IP"), "X")
    await user.type(getByLabelText("Internal IP"), "X")

    expect(ctx.updateRule).toHaveBeenNthCalledWith(1, {
      index: 0,
      rule: {
        extIp: "extIp",
        intIp: "intIp",
        name: "nameX"
      }
    } )
    expect(ctx.updateRule).toHaveBeenNthCalledWith(2, {
      index: 0,
      rule: {
        extIp: "extIpX",
        intIp: "intIp",
        name: "name"
      }
    } )
    expect(ctx.updateRule).toHaveBeenNthCalledWith(3, {
      index: 0,
      rule: {
        extIp: "extIp",
        intIp: "intIpX",
        name: "name"
      }
    } )
  })
})
