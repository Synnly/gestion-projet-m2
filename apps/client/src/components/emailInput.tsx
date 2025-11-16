import type { FieldError } from 'react-hook-form';

type EmailInputProps = {
    error?: FieldError;
} & React.InputHTMLAttributes<HTMLInputElement>;


<label className="floating-label">
  <span>Your Email</span>
  <input type="text" placeholder="mail@site.com" className="input input-md" />
</label>
export const EmailInput = ({error,...rest}:EmailInputProps) => {
    return (
        <>
           <label className="input">
  <span className="label">Email</span>
  <input type="text" placeholder="URL" />
</label>        </>
    )
}
