import { useState } from "react"
import { set } from "react-hook-form"

const API_URL = import.meta.env.VITE_APIURL
export const StudentSignup = ()=>{
    const [success,setsuccess] = useState<String>("")
    const createStudent = async () => {
        console.log("création de l'étudiant")
        try{
            await fetch(`${API_URL}/api/students`,{
                method:"POST",
                credentials:"include",
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({role:"STUDENT",firstName:"alexis",lastName:"chapusot",email:"revaj85649@besenica.com",password:"A172328a!"})
            })
        }
        catch(errors){
            if(errors instanceof Error){
                setsuccess(errors.message)
            }
        }
        setsuccess("succes")
        
        console.log("j'ai normalement crée l'étudiant")
    } 

    return(
        <div className="flex flex-row item-center" onClick={()=>createStudent()}>
            <button>s'inscrire</button>
        </div>
    ) 
}
