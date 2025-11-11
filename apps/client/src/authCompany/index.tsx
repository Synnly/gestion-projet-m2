import { Outlet } from 'react-router';
import signupImage from '../../assets/signup-image.avif';

export const AuthCompany = () => {
    return (
        <div className="flex flex-col-reverse xl:flex-row w-full min-h-screen flex-grow">
            <div className="flex-1 bg-neutral-50  xl:border-r-2 xl:px-28 flex flex-col p-4 min-h-full justify-center sm:pt-8 xl:pt-5">
                <div id="formDiv" className=" justify-start items-center">
                    <Outlet />
                </div>
            </div>
            <div className="flex xl:w-1/2 items-center justify-center max-h-[50vh] overflow-hidden xl:max-h-screen xl:p-5">
                <div className=" w-full h-full overflow-hidden rounded-2xl shadow-lg bg-white">
                    <img loading="lazy" src={signupImage} alt="Signup" className="w-full  h-full object-cover" />
                </div>
            </div>
        </div>
    );
};
