import { Outlet, redirect, useOutletContext } from "react-router"
import type { userContext } from ".."


/**
* @description Middleware which verify if user is company. must be used within AuthRoutes
*/
export const CompanyRoute = () => {
  const user = useOutletContext<userContext>();
  if(!user) throw new Error("Must be used within authRoutes or something with give user as outlet context ")
  if(!user.role.includes("COMPANY")) throw redirect("/") 
  return (
      <Outlet />
  )
}
